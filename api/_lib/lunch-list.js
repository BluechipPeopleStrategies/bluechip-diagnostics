// Optional list storage: appends one CSV row per registration to a file in a private GitHub
// repo via the Contents API. Entirely optional -- when LUNCH_LIST_GITHUB_TOKEN or
// LUNCH_LIST_REPO isn't set, appendToGithubList() is skipped by the caller before this ever
// runs. Git history in that repo is the consent record (see the registration map doc,
// "Decision direction: build our own").
const CSV_HEADER = 'timestamp,name,email,org,topics,comfort_level,one_thing,next_session_consent,page\n';

function ghHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
}

function csvField(v) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

function toCsvLine(row) {
  return (
    [row.timestamp, row.name, row.email, row.org, row.topics, row.comfortLevel, row.oneThing, row.nextSessionConsent, row.page]
      .map(csvField)
      .join(',') + '\n'
  );
}

async function getFile(api, token, ref) {
  const r = await fetch(`${api}?ref=${encodeURIComponent(ref)}`, { headers: ghHeaders(token) });
  if (r.status === 404) return { sha: null, content: '' };
  if (!r.ok) throw new Error(`github_get_failed_${r.status}`);
  const data = await r.json();
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  return { sha: data.sha, content };
}

/**
 * Appends one row. Retries once on a 409 (sha changed between our GET and PUT, e.g. two
 * registrations landing at the same moment): refetch the current sha and try again.
 */
export async function appendToGithubList(row) {
  const token = (process.env.LUNCH_LIST_GITHUB_TOKEN || '').trim();
  const repo = (process.env.LUNCH_LIST_REPO || '').trim(); // "owner/repo"
  if (!token || !repo) return { skipped: true };

  const path = (process.env.LUNCH_LIST_PATH || 'lunch-and-learn/registrations.csv').trim();
  const branch = (process.env.LUNCH_LIST_BRANCH || 'main').trim();
  const api = `https://api.github.com/repos/${repo}/contents/${path}`;
  const csvLine = toCsvLine(row);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let sha;
    let content;
    try {
      ({ sha, content } = await getFile(api, token, branch));
    } catch (err) {
      console.error('lunch-list: GitHub read failed', err);
      return { ok: false, error: String(err).slice(0, 300) };
    }
    const base = content ? (content.endsWith('\n') ? content : `${content}\n`) : CSV_HEADER;
    const newContent = base + csvLine;
    let res;
    try {
      res = await fetch(api, {
        method: 'PUT',
        headers: ghHeaders(token),
        body: JSON.stringify({
          message: `Add lunch registration: ${row.email}`,
          content: Buffer.from(newContent, 'utf8').toString('base64'),
          sha: sha || undefined,
          branch,
        }),
      });
    } catch (err) {
      console.error('lunch-list: GitHub write error', err);
      return { ok: false, error: String(err).slice(0, 300) };
    }
    if (res.ok) return { ok: true };
    if (res.status === 409 && attempt === 0) continue; // sha conflict: refetch and retry once
    const text = await res.text();
    console.error('lunch-list: GitHub write failed', res.status, text);
    return { ok: false, error: text.slice(0, 300) };
  }
  return { ok: false, error: 'conflict_after_retry' };
}
