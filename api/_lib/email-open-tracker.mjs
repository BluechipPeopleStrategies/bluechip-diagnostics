/** Dependency-free signed open-image handler; activated only by released configuration. */
import { createHmac, timingSafeEqual } from 'node:crypto';

const GIF=Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64');
const ALLOWED=new Set(['v','id','campaign','creative','iat','exp','qa']);
const ENDPOINT='https://check.bluechip-people-strategies.com/api/email-open';

function strongKey(key) {
  return typeof key==='string' && Buffer.byteLength(key,'utf8')>=32;
}

function validClaims(c) {
  return c && typeof c==='object' && !Array.isArray(c)
    && Object.keys(c).every(k=>ALLOWED.has(k)) && c.v===1
    && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(c.id||'')
    && /^[a-zA-Z0-9_-]{1,100}$/.test(c.campaign||'')
    && /^[a-zA-Z0-9_-]{1,40}$/.test(c.creative||'')
    && Number.isSafeInteger(c.iat) && Number.isSafeInteger(c.exp)
    && c.exp>c.iat && c.exp-c.iat<=30*24*3600
    && typeof c.qa==='boolean';
}

export function createTicket(claims,key) {
  if (!strongKey(key) || !validClaims(claims)) throw new Error('Invalid tracking claims or signing configuration');
  const payload=Buffer.from(JSON.stringify(claims)).toString('base64url');
  return payload+'.'+createHmac('sha256',key).update(payload).digest('base64url');
}

function verifyTicket(ticket,key,now) {
  if (!strongKey(key) || typeof ticket!=='string' || ticket.length>2048) return null;
  const pieces=ticket.split('.');
  if (pieces.length!==2 || !pieces.every(part=>/^[A-Za-z0-9_-]+$/.test(part))) return null;
  try {
    const expected=createHmac('sha256',key).update(pieces[0]).digest();
    const signature=Buffer.from(pieces[1],'base64url');
    if (signature.length!==expected.length || !timingSafeEqual(signature,expected)) return null;
    const claims=JSON.parse(Buffer.from(pieces[0],'base64url').toString('utf8'));
    if (!validClaims(claims) || claims.iat>Math.floor(now/1000)+300 || claims.exp<=Math.floor(now/1000)) return null;
    return claims;
  } catch { return null; }
}

function image(head=false) {
  return new Response(head?null:GIF,{status:200,headers:{
    'Content-Type':'image/gif','Content-Length':String(GIF.length),
    'Cache-Control':'private, no-store, no-cache, max-age=0',
    'Pragma':'no-cache','Expires':'0','X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer'
  }});
}

export async function handleRequest(request,env={},options={}) {
  const head=request.method==='HEAD';
  if (request.method!=='GET' || env.OPEN_TRACKING_ENABLED!=='1'
      || !strongKey(env.OPEN_TRACKING_SIGNING_KEY) || !env.POSTHOG_PROJECT_TOKEN) return image(head);
  const now=(options.now||Date.now)();
  let values;
  try { values=new URL(request.url).searchParams.getAll('t'); } catch { return image(); }
  if (values.length!==1) return image();
  const claims=verifyTicket(values[0],env.OPEN_TRACKING_SIGNING_KEY,now);
  if (!claims || claims.qa) return image();
  const payload={api_key:env.POSTHOG_PROJECT_TOKEN,event:'bc_email_open',
    distinct_id:'email-'+claims.id,timestamp:new Date(now).toISOString(),properties:{
      tracking_id:claims.id,utm_campaign:claims.campaign,creative_id:claims.creative,
      signal:'image_request_estimate',tracker_version:1,qa:false,
      $process_person_profile:false,$geoip_disable:true
    }};
  try {
    // Host is fixed. Never forward visitor headers, addresses, IPs or user agents.
    const response=await (options.fetchImpl||fetch)('https://us.i.posthog.com/i/v0/e/',{
      method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),
      signal:AbortSignal.timeout(options.captureTimeoutMs||1500)
    });
    // Drain the tiny response without logging tokens or request URLs.
    await response.arrayBuffer();
  } catch { /* An unavailable analytics service must not break email rendering. */ }
  return image();
}

export function prepareMessage(input,key) {
  const {html,endpoint,...claims}=input;
  if (endpoint!==ENDPOINT || typeof html!=='string' || /data-bc-open-tracker/i.test(html)) {
    throw new Error('Use the proposed owned endpoint and an uninstrumented HTML candidate');
  }
  const ticket=createTicket(claims,key);
  const pixel=`<img data-bc-open-tracker="1" src="${endpoint}?t=${ticket}" width="1" height="1" alt="" style="border:0;width:1px;height:1px" />`;
  return {state:'INSTRUMENTED_HTML_REQUIRES_SAVED_AND_SENT_PROOF',tracking_id:claims.id,
    campaign:claims.campaign,creative_id:claims.creative,expires_at:new Date(claims.exp*1000).toISOString(),
    html:html+pixel};
}

export function createNodeHandler(env=process.env,options={}) {
  return async (req,res) => {
    const request=new Request('https://check.bluechip-people-strategies.com'+(req.url||'/api/email-open'),{method:req.method||'GET'});
    const response=await handleRequest(request,env,options);
    res.statusCode=response.status;
    response.headers.forEach((value,name)=>res.setHeader(name,value));
    res.end(Buffer.from(await response.arrayBuffer()));
  };
}
