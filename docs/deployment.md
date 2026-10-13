# Git-connected Cloudflare Pages deployment

Production site: https://lofix.ng. Production API: https://api.lofix.ng.
Pushing to the configured production branch triggers publication. No separate
Wrangler upload or manual dashboard refresh is needed.

## Configure the existing Pages project once

- Connected repository: this frontend repository, not the backend repository.
- Production branch: main; automatic production deployments enabled.
- Build command: npm run build:cloudflare
- Build output directory: dist
- Root directory: repository root (or the frontend subdirectory for a monorepo).
- Production environment variable: VITE_API_URL=https://api.lofix.ng
- Keep secrets out of VITE_* variables; browser builds expose these values.

Cloudflare installs dependencies before its build command. build:cloudflare runs
all tests, then TypeScript and Vite production compilation, forcing the production
API URL, then writes dist/release.json. It contains the Git commit, clean/dirty
status and file hashes. Failure of a test or build stops this command.

## Each release

1. Review changes, including package-lock.json. Run npm run release:prepare locally
   to install locked dependencies, test and build. This does not publish anything.
2. Review and commit intended files. Do not commit .env or dist.
3. When ready to publish, push to main. This authorizes Cloudflare to deploy.
4. In Cloudflare Deployments, confirm the latest commit succeeds as Production.
5. Run npm run release:verify from your checkout of that same commit. It requires
   no local dist: it compares the published commit against HEAD and verifies the
   live HTML/JS/CSS hashes against the published build manifest. It does not compare
   local asset hashes, since Cloudflare and local build environments can differ.
6. Open lofix.ng and smoke-test registration error display, verification and login
   with an authorized test account. Asset verification does not prove delivery of
   email/SMS or browser cookie acceptance.

release:deploy is disabled for direct uploads and explains the Git workflow. Do
not use a second upload pipeline for this site. A plain npm run build does not
create the marker: Cloudflare must use build:cloudflare as configured above.

If release:verify receives HTML for release.json, the site likely serves a build
from the old command, or the custom domain points elsewhere. Check the deployed
commit, build command/logs and domain association. A failed verification does not
roll back an already published deployment. Use Cloudflare's previous successful
production deployment for rollback, and verify its commit afterward.

Reference: https://developers.cloudflare.com/pages/configuration/git-integration/
