/**
 * purge-fonts.mjs
 * Strips customFonts from all project documents and deletes font files from Storage.
 *
 * Usage:
 *   APPWRITE_KEY=<your-api-key> node purge-fonts.mjs
 *
 * Get an API key from: Appwrite Console → Project → Overview → API Keys
 * Required scopes: databases.read, databases.write, storage.read, storage.delete
 */

const ENDPOINT   = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a03448100046eb339ac';
const DB_ID      = 'webcanvas';
const COLL_ID    = 'projects';
const BUCKET_ID  = 'images';
const API_KEY    = process.env.APPWRITE_KEY;

if (!API_KEY) {
  console.error('Set APPWRITE_KEY environment variable first.');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key': API_KEY,
};

async function api(method, path, body) {
  const res = await fetch(`${ENDPOINT}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${err}`);
  }
  return res.json();
}

// ── 1. Strip customFonts from all project documents ──────────────────────────
async function purgeDocuments() {
  console.log('\n── Fetching project documents…');
  let offset = 0;
  let total  = Infinity;
  let patched = 0;

  while (offset < total) {
    const res = await api('GET', `/databases/${DB_ID}/collections/${COLL_ID}/documents?limit=100&offset=${offset}`);
    total  = res.total;
    offset += res.documents.length;

    for (const doc of res.documents) {
      let state;
      try { state = doc.state ? JSON.parse(doc.state) : null; } catch { state = null; }

      if (!state || !state.customFonts || state.customFonts.length === 0) {
        console.log(`  [skip] ${doc.$id} — no customFonts`);
        continue;
      }

      console.log(`  [patch] ${doc.$id} — removing ${state.customFonts.length} font(s): ${state.customFonts.map(f => f.name).join(', ')}`);
      state.customFonts = [];
      await api('PATCH', `/databases/${DB_ID}/collections/${COLL_ID}/documents/${doc.$id}`, {
        state: JSON.stringify(state),
      });
      patched++;
    }

    if (res.documents.length === 0) break;
  }

  console.log(`\n  Done — patched ${patched} document(s).`);
}

// ── 2. Delete font files from Storage ────────────────────────────────────────
// Font files have names ending in .ttf / .otf / .woff / .woff2
// (Appwrite stores the original filename in the file's `name` field)
async function purgeFontFiles() {
  console.log('\n── Fetching storage files…');
  let offset = 0;
  let total  = Infinity;
  let deleted = 0;

  while (offset < total) {
    const res = await api('GET', `/storage/buckets/${BUCKET_ID}/files?limit=100&offset=${offset}`);
    total  = res.total;
    offset += res.files.length;

    for (const file of res.files) {
      if (/\.(ttf|otf|woff2?)$/i.test(file.name)) {
        console.log(`  [delete] ${file.$id}  ${file.name}`);
        await api('DELETE', `/storage/buckets/${BUCKET_ID}/files/${file.$id}`);
        deleted++;
      } else {
        console.log(`  [keep]   ${file.$id}  ${file.name}`);
      }
    }

    if (res.files.length === 0) break;
  }

  console.log(`\n  Done — deleted ${deleted} font file(s).`);
}

(async () => {
  try {
    await purgeDocuments();
    await purgeFontFiles();
    console.log('\n✓ Purge complete.\n');
  } catch (e) {
    console.error('\n✗ Error:', e.message);
    process.exit(1);
  }
})();
