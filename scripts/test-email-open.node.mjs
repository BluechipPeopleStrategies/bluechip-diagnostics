import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createTicket, handleRequest, prepareMessage, createNodeHandler } from '../api/_lib/email-open-tracker.mjs';

const key = 'local-tests-only-signing-key-32-characters';
const now = 1792177200000;
const claims = {v:1,id:'17ad9e4a-a1a6-4caa-9bdf-d72e443e59c8',campaign:'fictional_campaign',creative:'e01',iat:1792173600,exp:1792260000,qa:false};
const env = {OPEN_TRACKING_ENABLED:'1',OPEN_TRACKING_SIGNING_KEY:key,POSTHOG_PROJECT_TOKEN:'phc_local_test'};
const request = token => new Request('https://check.bluechip-people-strategies.com/api/email-open?t='+token);
function assertPixel(data) {
  const bytes=Buffer.from(data);
  assert.equal(bytes.subarray(0,6).toString(),'GIF89a');
  assert.equal(bytes.readUInt16LE(6),1);
  assert.equal(bytes.readUInt16LE(8),1);
  assert.equal(bytes.at(-1),0x3b);
}

test('valid signed GET emits an anonymous estimate without recipient or request metadata', async () => {
  let sent;
  const response=await handleRequest(request(createTicket(claims,key)),env,{now:()=>now,fetchImpl:async (url,options)=>{
    sent={url,body:JSON.parse(options.body)};return new Response('{}',{status:200});
  }});
  assert.equal(response.headers.get('Content-Type'),'image/gif');
  assertPixel(await response.arrayBuffer());
  assert.equal(response.headers.get('Set-Cookie'),null);
  assert.match(response.headers.get('Cache-Control'),/no-store/);
  assert.equal(sent.url,'https://us.i.posthog.com/i/v0/e/');
  assert.equal(sent.body.event,'bc_email_open');
  assert.equal(sent.body.properties.tracking_id,claims.id);
  assert.equal(sent.body.properties.$process_person_profile,false);
  assert.equal(sent.body.properties.$geoip_disable,true);
  assert.equal(JSON.stringify(sent).includes('@'),false);
  assert.equal('ip' in sent.body.properties,false);
  assert.equal('user_agent' in sent.body.properties,false);
});

test('disabled endpoint and absent signing credentials never capture', async () => {
  for (const settings of [{},{...env,OPEN_TRACKING_ENABLED:'0'},{...env,OPEN_TRACKING_SIGNING_KEY:''}]) {
    let calls=0;
    const response=await handleRequest(request(createTicket(claims,key)),settings,{now:()=>now,fetchImpl:async()=>{calls++;return new Response('{}');}});
    assert.equal(response.status,200);assert.equal(calls,0);
  }
});

test('tampered expired future oversized and extra-PII tickets produce no event', async () => {
  const tokens=[createTicket(claims,key).slice(0,-2)+'xx',createTicket({...claims,exp:1792177000},key),
    createTicket({...claims,iat:1792180000,exp:1792260000},key),'a'.repeat(5000)];
  assert.throws(()=>createTicket({...claims,email:'someone@example.org'},key));
  for (const token of tokens) {
    let calls=0;
    await handleRequest(request(token),env,{now:()=>now,fetchImpl:async()=>{calls++;return new Response('{}');}});
    assert.equal(calls,0);
  }
});

test('HEAD and duplicate-token queries do not count as opens', async () => {
  const token=createTicket(claims,key);let calls=0;
  const options={now:()=>now,fetchImpl:async()=>{calls++;return new Response('{}');}};
  const head=await handleRequest(new Request(request(token),{method:'HEAD'}),env,options);
  assert.equal((await head.arrayBuffer()).byteLength,0);
  await handleRequest(new Request(request(token).url+'&t='+token),env,options);
  assert.equal(calls,0);
});

test('QA ticket is not emitted into prospect reporting', async () => {
  let calls=0;
  await handleRequest(request(createTicket({...claims,qa:true},key)),env,{now:()=>now,fetchImpl:async()=>{calls++;return new Response('{}');}});
  assert.equal(calls,0);
});

test('failed ingestion still returns the image promptly', async () => {
  const response=await handleRequest(request(createTicket(claims,key)),env,{now:()=>now,fetchImpl:async()=>{throw new Error('offline');}});
  assert.equal(response.status,200);
  assertPixel(await response.arrayBuffer());
});

test('ingestion redirects never forward the capture body to a second host', async () => {
  for (const status of [307,308]) {
    let firstCalls=0,forwarded=0;
    const target=createServer((_req,res)=>{forwarded++;res.end('{}');});
    await new Promise(resolve=>target.listen(0,'127.0.0.1',resolve));
    const origin=createServer((_req,res)=>{
      firstCalls++;res.writeHead(status,{Location:`http://127.0.0.1:${target.address().port}/capture`});res.end();
    });
    await new Promise(resolve=>origin.listen(0,'127.0.0.1',resolve));
    try {
      const response=await handleRequest(request(createTicket(claims,key)),env,{now:()=>now,
        fetchImpl:(_fixedUrl,options)=>fetch(`http://127.0.0.1:${origin.address().port}/capture`,options)});
      assertPixel(await response.arrayBuffer());
      assert.equal(firstCalls,1);
      assert.equal(forwarded,0);
    } finally {
      origin.closeAllConnections();target.closeAllConnections();
      await Promise.all([new Promise(resolve=>origin.close(resolve)),new Promise(resolve=>target.close(resolve))]);
    }
  }
});

test('an unresponsive ingestion request is bounded by an actual abort', async () => {
  const started=Date.now();
  const response=await handleRequest(request(createTicket(claims,key)),env,{now:()=>now,captureTimeoutMs:25,
    fetchImpl:(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('aborted'))))});
  assert.equal(response.status,200);
  assert.ok(Date.now()-started<1500);
});

test('candidate keeps original links and uses an opaque URL on the owned endpoint', () => {
  const original='<p>Fictional preview.</p><a href="https://example.org/unchanged">Link</a>';
  const candidate=prepareMessage({html:original,...claims,endpoint:'https://check.bluechip-people-strategies.com/api/email-open'},key);
  assert.ok(candidate.html.startsWith(original));
  assert.match(candidate.html,/width="1" height="1"/);
  assert.equal(candidate.tracking_id,claims.id);
  assert.equal(candidate.state,'INSTRUMENTED_HTML_REQUIRES_SAVED_AND_SENT_PROOF');
  assert.equal(candidate.html.includes('someone@example.org'),false);
  assert.throws(()=>prepareMessage({html:original,...claims,endpoint:'https://other.example/api/email-open'},key));
  assert.throws(()=>prepareMessage({html:candidate.html,...claims,endpoint:'https://check.bluechip-people-strategies.com/api/email-open'},key));
});

test('Node adapter serves the pixel over real local HTTP without an external analytics call', async () => {
  let captured;
  const server=createServer(createNodeHandler(env,{now:()=>now,fetchImpl:async (_url,options)=>{
    captured=JSON.parse(options.body);return new Response('{}');
  }}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const response=await fetch(`http://127.0.0.1:${server.address().port}/api/email-open?t=${createTicket(claims,key)}`);
    assertPixel(await response.arrayBuffer());
    assert.equal(captured.properties.tracking_id,claims.id);
    assert.equal(response.headers.get('Set-Cookie'),null);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
