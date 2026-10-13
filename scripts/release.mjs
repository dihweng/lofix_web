import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseReleaseMarker } from './release-marker.mjs';
process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const run = (cmd, args, options = {}) => execFileSync(cmd, args, { stdio: 'inherit', ...options });
const git = (...args) => run('git', args, { encoding: 'utf8', stdio: 'pipe' }).trim();
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function files(dir = 'dist') {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
function manifest() {
  return Object.fromEntries(files().filter(f => !f.endsWith('/release.json')).sort().map(f => [f.slice(5), digest(readFileSync(f))]));
}
async function verify(waitForPropagation = false) {
  const attempts = waitForPropagation ? 12 : 1;
  const expectedCommit = git('rev-parse', 'HEAD');
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const get = async file => {
        const response = await fetch(`https://lofix.ng/${file}?release=${expectedCommit}`, { cache: 'no-store', signal: AbortSignal.timeout(15000), redirect: 'error' });
        if (!response.ok) throw Error(`HTTP ${response.status} for ${file}`);
        return Buffer.from(await response.arrayBuffer());
      };
      const live = parseReleaseMarker(await get('release.json'));
      if (live.commit !== expectedCommit || live.dirty !== false) throw Error('Custom domain is not serving a clean build of the current Git commit');
      if (live.api !== 'https://api.lofix.ng' || !live.files?.['index.html']) throw Error('Invalid production release manifest');
      if (digest(JSON.stringify({ commit: live.commit, inventory: live.files })) !== live.id) throw Error('Invalid release fingerprint');
      // Verify actual HTML and assets, not only a copied version marker.
      for (const [file, hash] of Object.entries(live.files).filter(([f]) => f === 'index.html' || /\.(js|css)$/.test(f))) {
        if (!/^[a-zA-Z0-9_./-]+$/.test(file) || file.includes('..') || file.startsWith('/')) throw Error('Invalid asset path');
        if (digest(await get(file)) !== hash) throw Error(`Published file mismatch: ${file}`);
      }
      console.log(`Verified https://lofix.ng serves release ${expectedCommit}`);
      return;
    } catch (error) {
      if (attempt === attempts - 1) throw error;
      console.log(`Waiting for published build (${attempt + 1}/${attempts}): ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
async function main() {
  const command = process.argv[2];
  if (command === 'prepare' || command === 'ci') {
    if (command === 'prepare') run('npm', ['ci']);
    run('npm', ['test']);
    run('npm', ['run', 'build'], { env: { ...process.env, VITE_API_URL: 'https://api.lofix.ng' } });
    const inventory = manifest();
    const commit = git('rev-parse', 'HEAD');
    const dirty = !!git('status', '--porcelain');
    const id = digest(JSON.stringify({ commit, inventory }));
    writeFileSync('dist/release.json', JSON.stringify({ id, commit, dirty, api: 'https://api.lofix.ng', createdAt: new Date().toISOString(), files: inventory }, null, 2));
    console.log(`Prepared ${id}. ${dirty ? 'Working tree has changes: commit and prepare again before deployment.' : 'Ready for an explicitly authorized deployment.'}`);
  } else if (command === 'deploy') {
    throw Error('Deployment uses Cloudflare Git integration. Review and push your commit to main; Cloudflare builds and publishes it automatically.');
  } else if (command === 'verify') await verify();
  else throw Error('Usage: node scripts/release.mjs prepare|ci|verify');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
