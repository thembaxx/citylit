# Citylit security audit — 8 October 2026

**Repository:** [thembaxx/citylit](https://github.com/thembaxx/citylit) · **Production:** https://citylit.vercel.app

**Reviewed baseline:** `5cbab7abd8161c5e82a7a7df540ec5ed4b43281f` · **Remediation branch:** `audit/security-hardening`

No confirmed critical or high-severity vulnerability was found in the reviewed application. Dependency databases reported no known advisories and the Git history scan found no secrets. This is a point-in-time source, configuration and targeted local security assessment, not a guarantee of security or an independent penetration-test certification.

The principal unresolved finding is **unprotected main**. Application and ingestion fixes in this branch are **proposed changes, not production remediations until merged and deployed**. Production observations below describe the baseline, not the branch preview.

## Scope and trust boundaries

Reviewed all application routes, client components, local state, offline code, JSON/Markdown/structured-data outputs, Next.js configuration, Python ingestion and tooling scripts, dependency manifests/lockfile, repository automation and visible GitHub settings. Read-only production requests covered `/`, `/api/health`, `/offline.html`, `/sw.js`, `/data/places.json` and `/share/durban`. Adversarial fixtures ran locally, never against venue systems or production private-network addresses.

| Surface | Boundary and assessment |
| --- | --- |
| Public discovery HTML and data | Static, curated catalog: 83 places, 12 destinations, nine provinces, 53 credited images. React escapes text; JSON-LD serialization escapes `<` to prevent closing a script element. |
| Server endpoints | Health GET, source guides, AI-readable text and sharing cards. No accounts, database writes, Server Actions, arbitrary remote fetch API or upload endpoint found. |
| Editorial dashboard | Public catalog-quality view and browser-local correction drafts/export. No shared inbox or server publishing capability. Its public availability is not an authorization bypass. |
| Browser persistence | Saves, visits, plans, settings and drafts remain on the device. Untrusted local state must be schema-validated; it is not proof of identity or authoritative venue information. |
| Directions/location | User-initiated browser location permission; planning runs locally. External directions, source links and OSM tiles disclose requests to their providers as documented in `/privacy`. |
| Ingestion | Python scripts fetch provider APIs, official venue sites and images during maintenance/CI, not at visitor request time. Treat external response content and redirects as untrusted. |
| CI and delivery | Actions have read-only defaults, pinned action SHAs and credential-free checkout. Catalog publishing is isolated from the refresh/build job. Vercel's Git integration owns deployment. |
| LLM-readable endpoints | Public reading material only. No model backend, agent tool execution, private retrieval corpus or visitor chat input found. Prompt execution attacks are not applicable to the current runtime. |

## Findings and changes

Severity considers the current static/public architecture and the conditions required for exploitation. Hardening items are distinguished from demonstrated application exploits.

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| SEC-01 | Medium | Main accepts changes without enforced review/check gates | **Open: owner administration required** |
| SEC-02 | Medium | Maintenance fetches followed unchecked redirects and had no public-destination validation | **Fixed in branch** |
| SEC-03 | Medium | Ingestion body/image decoding had incomplete resource limits | **Fixed in branch** |
| SEC-04 | Low, defense in depth | Production CSP restricted framing/objects but did not restrict script execution or network destinations | **Hardened in branch** |
| SEC-05 | Low, availability/defense in depth | Browser-local state, shared trip IDs and source URLs lacked consistent schema/bounds checks | **Fixed in branch** |
| SEC-06 | Low, supply-chain hardening | Python image dependency was a lower-bound requirement and missing from routine advisory coverage | **Hardened in branch** |
| SEC-07 | Low, resource hardening | Social cards rendered at runtime with cacheable query variants | **Hardened in branch** |

### SEC-01: main protection is not enforced

GitHub returned `protected: false` for main and an empty ruleset list on the audit date. Checked-in ruleset JSON is a plan, not effective protection. A collaborator or compromised write credential can bypass the configured CI/review process when pushing or merging. The integration previously returned HTTP 403, “Resource not accessible by integration,” on administration requests.

Use an owner-authorized local `gh` login and [the existing setup helper](../scripts/configure-github.py). Review `--phase bootstrap` and apply the appropriate phase with `--apply`; move to `steady` only once all required checks can pass. See [repository automation](repository-automation.md). Add an independent reviewer before requiring independent human approval. Verify the resulting live ruleset, not just the file.

The repository code-scanning alert API returned HTTP 403, so the integration cannot enumerate security alerts; visible PR annotations/checks and workflow logs can still be reviewed. CodeQL analysis-job success alone does not certify that no alert exists. The repository response returned `security_and_analysis: null`; this is insufficient visibility to determine whether native secret scanning, push protection or private reporting are enabled. Owner verification remains necessary. Installed GitGuardian and repository Gitleaks checks are separate controls.

### SEC-02: isolate maintenance fetch destinations and redirects

The previous Python ingestion used urllib on remote metadata and venue URLs, with automatic redirects. A malicious/compromised source or altered catalog could lead a maintenance process to unintended network destinations. This affects the ingestion runner; there is no public visitor SSRF endpoint.

[`safe_fetch.py`](../scripts/safe_fetch.py) now requires credential-free HTTPS on port 443, validates provider/venue host allowlists at every hop, refuses automatic redirects and limits the chain to three redirects. DNS answers must all be public unicast addresses. Direct TLS connections use those validated numeric addresses without a second connection-time DNS lookup, while preserving hostname verification and system CA trust. API/image/geography/geocoding/research callers share this transport.

Official venues may redirect only within their explicitly approved root/`www` host pair; legitimate cross-domain moves fail closed and require reviewed allowlist changes. Provider redirects use explicit provider hosts. Unit fixtures verify rejection before requesting private, mixed-DNS, multicast, file, HTTP or unapproved redirect destinations, including changed DNS answers at connect time. A small real Wikipedia HTTPS request succeeded through the configured session transport.

**Residual boundary:** a configured HTTP(S) proxy is a trusted transport. The process validates destination DNS, but cannot dictate the proxy's internal DNS resolution or inspect its network. The proxy/operator must enforce destination egress, including DNS rebinding protection. Private/internal proxy connectivity itself is intentionally retained. Do not expose ingestion as a public URL-fetch endpoint without an independently enforced network policy.

### SEC-03: bound external bodies and image decoding

Previous downloads could read whole responses, and image conversion lacked an explicit decoded-pixel budget. A compromised source could exhaust maintenance memory or storage. The new transport enforces byte budgets before and during reading, rejects unexpected content encodings, uses socket timeouts, and bounds official-page prefix reads. Typical budgets: JSON 4 MiB, official HTML 1 MB, photos 12 MiB, geography 16 MiB; the helper refuses budgets above 32 MiB. CI refreshes additionally have a 20-minute job timeout. Socket timeouts are not a strict end-to-end deadline for a trickling source.

[`safe_images.py`](../scripts/safe_images.py) accepts only still JPEG/PNG/WebP, checks at most 12 million pixels before decoding, treats Pillow decompression warnings as errors, resizes to 1200 pixels, and writes a local JPEG without source metadata. Tests reject a forged PNG pixel-bomb header before decoding and reject excess bytes before invoking Pillow. This reduces attack surface; it does not replace keeping image parsers patched.

The catalog audit now checks public HTTPS source/license links, strict slugs and hashed local JPEG paths across place/city/landmark credits. Legacy Creative Commons HTTP license links were changed to their canonical HTTPS equivalents; no venue fact or research date was invented.

### SEC-04: browser Content Security Policy

Baseline production had `frame-ancestors 'self'; object-src 'none'; base-uri 'self'`. No XSS exploit was demonstrated, but this policy offered little script-execution containment.

[`proxy.ts`](../proxy.ts) creates a fresh 192-bit nonce for each HTML request and replaces caller-supplied nonce/CSP headers. Next.js runtime and JSON-LD scripts use that nonce. Production scripts use nonce/`strict-dynamic`, disallow inline event handlers and `eval`, and limit data connections/images to local assets and OSM tiles. Object embedding, frames, base URL changes and foreign form submissions are disallowed. Image optimization accepts only query-free local `/images/*` paths, no remote hosts, no redirects, SVGs or local-IP fetching.

**Tradeoffs:** nonce-bearing HTML is dynamically rendered and marked private/no-store; utility HTML also loses static HTML caching. Local photos, JS/fonts, catalog JSON, Markdown and precomputed sharing cards remain cacheable. `style-src 'unsafe-inline'` is intentional for Motion/GSAP/Three/MapLibre animated styles. Development alone permits `unsafe-eval` and WebSocket connections. `strict-dynamic` trusts loaders started by nonce-bearing scripts, so keeping dependency and DOM URL sinks reviewed is still essential.

Offline HTML now uses same-origin external JavaScript, allowing its cacheable response to use a script policy without an inline-script exemption. Service-worker updates are not cached indefinitely. Browser tests inject attack text into the actual response parser and check blocked scripts/handlers; privileged DevTools evaluation is not a valid substitute for this test.

### SEC-05: local state, correction links and offline rendering

Malformed local JSON could crash state consumers; shared itinerary input could duplicate invalid/cross-city IDs. Corrections accepted HTTP/credential-bearing links, and the offline guide lacked the same link/image bounds. These are principally local availability and unsafe-navigation risks, not remote privilege escalation.

[`client-data.ts`](../lib/client-data.ts) validates known catalog IDs, deduplicates lists, limits trips to 30 stops and shared input to 4096 characters, caps stored payload reads, and bounds correction queues/fields. Correction source links require public credential-free HTTPS. Malformed/unknown fields fall back safely. React and offline `textContent` render correction/catalog text literally. The offline script rejects unsafe link schemes and foreign image paths; the worker downloads only hashed local JPEGs, with a 30-ID download bound and same-origin message check.

Tests cover malformed local objects/null, unknown IDs, credential-bearing/private/scheme URLs, cross-city trip input, hostile text and offline links/photos. Local drafts are not authenticated or synced. If remote publishing is added, server authorization, CSRF/rate limits, schema validation, moderation and audit logging must be designed anew.

### SEC-06: pin and audit Python dependencies

Pillow is pinned to the audited `12.3.0` version with SHA-256 hashes for official release distributions; installation requires hashes in CI and refresh jobs. Security CI now runs pinned `pypa/gh-action-pip-audit` against that requirements file. This closes a coverage/reproducibility gap; Pillow had no known advisory during this audit. Update the version and reviewed distribution hashes together, and rerun image regression tests.

Existing pnpm lockfile, frozen installs, dependency overrides, minimum-release-age policy, SHA-pinned Actions and checksum-verified CI tools remain in place. No credential, provider token or additional privileged workflow was introduced.

### SEC-07: sharing-card generation

All 165 catalog sharing cards now render at build time with `dynamicParams = false`; arbitrary routes return 404 and query variants reuse precomputed bytes. Local filesystem images are already constrained to known catalog JPEG paths. This removes runtime image-rendering work; it does not protect dynamic HTML or other public endpoints against traffic floods. There was no production load/DoS test.

Next serves precomputed public cards/guides as unchanged static bytes for POST as well as GET; they perform no writes. The dynamic health handler rejects POST with 405. Returning public static bytes for POST is not an authentication/CSRF vulnerability.

## Verification and scanner triage

| Check | Result |
| --- | --- |
| pnpm advisory audit, including development dependencies | 487 dependency entries reported; **zero advisories**, all severity levels |
| pip-audit 2.10.1 | Pillow 12.3.0; **zero known vulnerabilities**; hash-locked audit also passes |
| Gitleaks 8.30.1 | Complete fetched baseline history: **22 commits**, 2.18 MB scanned; **no leaks found**, redacted output; staged remediation diff also scanned without findings |
| Bandit 1.9.4 | Final application/tooling scan: **8 findings**, seven low subprocess warnings and one medium generic urllib warning; context below |
| Semgrep 1.180.0 | `p/security-audit`, `p/typescript`, `p/python`: **288 rules**, 88 files, one generic urllib finding, **no parse errors** after JSX entity normalization |
| Actionlint 1.7.12 | Modified workflows pass |
| Python security regressions | **16 tests pass**: URL/DNS/redirect/resource/image checks |
| Application checks | Formatting, Oxlint, strict TypeScript, Python compilation, catalog audit and optimized Next.js build pass |
| Browser security and application regressions | **109 pass, one desktop-only touch test skipped** on mobile/desktop Chromium; coverage includes CSP nonce/injection, optimizer restrictions, local/offline input handling, full discovery, gestures, gallery, accessibility and SEO |

Remaining scanner findings were reviewed rather than suppressed:

- `scripts/install-ci-tools.py:29`: Semgrep dynamic-urllib and Bandit B310. Its URL comes from two fixed HTTPS release URLs selected by argparse choices, not untrusted source data. Downloads are bounded and must match a pinned SHA-256 before any execution. The tar reader reads one named regular binary with a size bound and never extracts arbitrary archive paths. No exploitable arbitrary-file read or code execution was established.
- Bandit B404/B603/B607 in `configure-github.py`, `crawl-sources.py`, `fetch-geography.py`: subprocess imports/calls and PATH lookup. Calls use argument arrays, not a shell; repository identifiers are validated, catalog data does not become executable shell text, and tool names/arguments are controlled. They trust the maintenance runner's executable PATH, as documented by their use of installed `gh`, `node` and `pnpm` tooling. No command injection was established.
- CodeQL PR analysis flagged a case-sensitive script-tag inspection regex in the new regression test. It was an inspection assertion, not an HTML sanitizer or production sink; making tag inspection case-insensitive addresses the warning without a suppression.
- Initial scans had 16 Bandit findings and seven Semgrep findings. Ingestion refactoring removed the unchecked URL callsites; a production geography assertion became an explicit runtime check. No security-rule blanket suppression was added.

Reproduce locally after a frozen install; use an isolated Python environment for audit tools:

```sh
pnpm install --frozen-lockfile
python3 -m pip install --require-hashes -r scripts/requirements.txt
python3 -m unittest discover -s scripts/tests -v
pnpm format:check
pnpm lint
pnpm typecheck
pnpm data:audit
python3 -m compileall -q scripts
pnpm ci:workflows
pnpm audit --json
pip-audit --require-hashes -r scripts/requirements.txt
pnpm security:scan
bandit -r scripts -x scripts/tests -f json
semgrep scan --config p/security-audit --config p/typescript --config p/python \
  --metrics off --disable-version-check --no-git-ignore \
  app components lib scripts public/offline.js public/sw.js proxy.ts next.config.ts
pnpm build
pnpm test
```

Scanner packages are audit-time tools, not production dependencies. Save full machine-readable output privately when needed; do not publish active credentials in diagnostics.

## Existing protections and non-findings

Production HTTPS responses supplied HSTS (`max-age=63072000; includeSubDomains; preload`), `nosniff`, SAMEORIGIN framing, strict-origin-when-cross-origin referrers, camera/microphone disabled and geolocation limited to self. Health is no-store and exposes only a validated public revision. No X-Powered-By header was present.

Vercel's permissive CORS on intentionally public static catalog/assets is not private-data exposure. Catalog paths/route ownership are checked; mismatched city/category/place combinations return 404. No arbitrary filesystem-read endpoint was found. External links use `noreferrer`; no source string is used as executable HTML. Service workers do not cache third-party map tiles or private account data. No known secret-bearing client environment variable was found.

Automation review found no `pull_request_target` checkout/execution of untrusted PR code. Catalog publishing uses a separate write-token job; the privileged deployment smoke job does not check out the app. Its URL/redirect allowlist and original-origin-only bypass header limit token disclosure. A token's available permissions are still part of the hosting/integration trust boundary.

## Remaining operator work and limits

1. **Enforce main protection (SEC-01).** Verify owner security settings, private reporting and least-privilege credentials. Current integration visibility cannot confirm these controls.
2. **Configure protected-preview smoke access.** Preview protection is enabled, but `VERCEL_AUTOMATION_BYPASS_SECRET` is missing. Checks correctly fail closed on sign-in redirects. Store the Vercel automation bypass token as the repository Actions secret; never disable protection to make a test pass. Restrict that secret to the workflow that needs it.
3. **Enforce runner/proxy egress.** Ingestion should reach approved public sources only; configured proxies must enforce their own destination DNS/network policy. Consider process memory limits and a wall-clock deadline for untrusted source refreshes beyond socket/job timeouts.
4. **Observe traffic and recovery.** Configure owner alerts for errors, dependency findings, unexpected deployment changes and abusive traffic; review Vercel Firewall/rate controls appropriate to real traffic. No WAF configuration, logs, billing limits or private Vercel team settings were inspectable here. A smoke test detects a bad release but does not roll it back.
5. **Keep feature boundaries explicit.** Before adding accounts, remote corrections, uploads, user-generated pages or an AI assistant, conduct a new threat review. Browser-local/public architecture does not provide server access controls for those features.

Not performed: credential rotation, private cloud/log access, social engineering, destructive probes, production stress testing, independent cryptographic review, full native-browser/device coverage or third-party provider audits. SAST coverage and advisory databases have limits; “no known advisories” does not mean “no vulnerabilities.”
