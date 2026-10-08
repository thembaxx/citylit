# Contributing

Use Node.js 24 and the pnpm version pinned in package.json. Install with pnpm install --frozen-lockfile. Make changes on a feature branch and open a pull request.

Before submitting, run pnpm format:check, pnpm lint, pnpm typecheck, pnpm data:audit, pnpm security:audit, pnpm build and pnpm test. Install Playwright Chromium first when needed. Workflow changes must also pass Actionlint and Zizmor; pinned CI tooling can be installed with scripts/install-ci-tools.py.

Preserve mobile gestures, the single shared Three.js canvas, reduced/essential motion, both themes and 16px inputs. Country, city and category chapters fit one viewport. Detail and listing content may scroll internally.

Data additions require public sources, check dates, explicit confidence, accurate coordinate roles and licensed photos. Unknown facts stay unconfirmed. Review cached source changes before publishing.

CodeRabbit reviews feature and dependency PRs, including stacked branches. GitGuardian scans commits through the installed GitHub app. Resolve relevant review threads and verify the deployed preview before merging.

The main ruleset uses PRs and automated gates while there is one maintainer. Add an independent code owner before enabling mandatory human approval. See [repository automation](docs/repository-automation.md).
