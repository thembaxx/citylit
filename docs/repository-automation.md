# Repository automation

## What runs

| Automation                  | Behavior                                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI / verify                 | Frozen install, formatting, catalog audit, lint, strict TypeScript, Python syntax, production build and mobile/desktop browser tests. Failure traces are retained for seven days.                                   |
| Security / security         | Gates the dependency audit/review, complete-history redacted Gitleaks scan, Actionlint, Zizmor and CodeQL for TypeScript/JavaScript and Python. Scheduled checks catch newly disclosed advisories.                  |
| GitGuardian Security Checks | Existing installed GitGuardian app scans commits and PRs. No duplicate API-key workflow is needed.                                                                                                                  |
| CodeRabbit                  | Existing installed app gets project-specific review instructions, incremental reviews on all base branches and a stable legacy CodeRabbit status. Binary assets/generated cache reports are omitted from review.    |
| Vercel                      | Existing Git integration publishes previews and production from its configured production branch. Frozen installation/build commands are checked in.                                                                |
| Deployment smoke            | After a successful Vercel Preview/Production deployment, verifies page shells, a JavaScript bootstrap asset, health, manifest, catalog and 404 behavior and posts a commit status. Also supports manual URL checks. |
| Dependabot                  | Weekly npm, GitHub Actions and Python dependency PRs; minor/patch upgrades are grouped and major upgrades stay separate.                                                                                            |
| Catalog refresh             | Read-only source refresh/build; a separate publishing job writes the candidate branch/PR. Bot-created PRs explicitly dispatch CI/security because GITHUB_TOKEN events do not retrigger Actions automatically.       |

Actions are pinned to verified commit SHAs. Linux CI binaries are pinned and checked against release SHA-256 digests; the installer reads one regular binary instead of extracting arbitrary archive paths. pnpm uses a one-day minimum release age with strict enforcement and a reviewed exception for the upstream GeoPackage security patch. Dependency overrides select patched ZIP libraries; all runtime and development advisories remain visible to the audit.

Vercel owns deployment publishing; these workflows do not duplicate deployments or require a Vercel token. The health endpoint at /api/health returns only status and is not cached. Production promotion remains the configured Vercel Git integration behavior; the post-deployment smoke check detects a bad deployment but does not automatically roll it back. Use the Vercel dashboard to restore a known-good deployment when necessary.

Vercel preview protection is currently enabled, so smoke checks fail closed until the owner creates a Protection Bypass for Automation secret in the Vercel project and stores it as the repository Actions secret VERCEL_AUTOMATION_BYPASS_SECRET. This is a protection bypass token, not the Vercel account API token. Public deployments need no token. Sign-in redirects report this missing setup explicitly; the check does not mark protected deployments as tested or successful. Smoke requests accept only Citylit's HTTPS Vercel domains, validate every redirect, send the bypass header only to the original deployment origin, and never check out or execute application code with their status-write token.

## Apply main protection

GitHub returned HTTP 403 (“Resource not accessible by integration”) for repository administration using the current coding integration. The repository owner has admin rights, but that does not grant this integration administration permission. Main protection and repository security switches are prepared, not claimed active.

Authenticate gh locally with a repository-owner account that has administration and Actions-write permissions, then review the plan:

    python3 scripts/configure-github.py --phase bootstrap

Apply it:

    python3 scripts/configure-github.py --phase bootstrap --apply

If an older PR is missing an app check, update its feature branch or rerun that integration before merging. Bootstrap requires the already-existing verify, GitGuardian Security Checks, CodeRabbit and Vercel checks so the existing stacked PRs can merge. It blocks deletion, force pushes and direct changes, requires linear history, up-to-date checks and resolved review threads, and has no bypass actors. Use squash merge for the stacked PRs.

Merge the existing PR stack in dependency order and retarget each remaining PR to main after its base merges. After this automation PR is merged and its first deployment smoke check succeeds, add the new security/deployment gates and block high/critical CodeQL alerts:

    python3 scripts/configure-github.py --phase steady --apply

The checked-in policies are .github/rulesets/main-bootstrap.json and .github/rulesets/main.json. Checks are bound to their GitHub app IDs. The helper updates only the ruleset with the Citylit name, preserves unrelated rulesets and verifies active enforcement after applying.

The helper also enables squash-only merging, branch cleanup, the auto-merge capability, Dependabot alerts/security PRs, private reports, native secret scanning/push protection, and read-only default Actions permissions. GitHub combines permission for Actions to create and approve PRs in one switch; it is enabled for catalog PR creation. No workflow approves its own PRs, merges automatically or bypasses main protection.

There is currently one human collaborator, so independent human approval would block every self-authored PR. CODEOWNERS routes review to the owner; automated gates and resolved discussions are mandatory. After adding a trusted independent code owner, require one approval:

    python3 scripts/configure-github.py --phase steady --require-approval --apply

Do not apply steady before these workflows are merged to main and the protected-preview smoke check passes: requiring checks that cannot run on earlier PRs would block the stack. Scheduled workflows and Dependabot operate from the default branch after merge. The Vercel deployment-status workflow already runs for this feature branch's deployments, as verified on PR #4.

Owner settings: https://github.com/thembaxx/citylit/settings/rules and https://github.com/thembaxx/citylit/settings/security_analysis
Vercel project: https://vercel.com/thembaxxs-projects/citylit/settings/git

## Review and release

Open a feature PR, inspect the Vercel preview, and wait for the automated gates. The production branch in Vercel should be main. Main code changes happen only by merging a PR; production smoke checks then verify the deployed result. None of this task's feature branches are merged or pushed directly to main.

CodeRabbit approval is automated review, not an independent human review. Dependabot upgrades and catalog refreshes still require review; no automatic dependency merging is enabled.

Useful local checks:

    python3 scripts/install-ci-tools.py actionlint
    python3 scripts/install-ci-tools.py gitleaks
    pnpm ci:workflows
    pnpm security:scan
    pnpm security:audit

The pinned tool archives target Linux x64. Use platform-specific official releases for local checks on other systems.
