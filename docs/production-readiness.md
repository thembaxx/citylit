# Search and production readiness

Citylit serves its interactive atlas at **https://citylit.vercel.app**. Its crawlable city directory is at `/destinations`, with nine province guides at `/provinces/[province]`. The interactive map, city and category pages remain full-screen.

## Search engines and sharing

- Country, city, category and place pages have unique titles, descriptions, canonical production URLs and contextual Open Graph/Twitter cards. `/share/...` serves a precomputed credited image from the local catalog, never arbitrary remote content.
- `/sitemap.xml` includes populated, canonical destination pages and public information pages. Empty categories, filters, browser-local editorial tools, invalid routes and shared trip parameters are excluded. Filtered pages have `noindex, follow`; `view=places` canonicalizes to its category. Source-check dates inform `lastmod`, rather than a fabricated rebuild date.
- `/robots.txt` advertises the sitemap. Vercel previews disallow crawling and page metadata uses `noindex`. Preview protection remains enabled.
- JSON-LD describes the website, breadcrumbs, collections and places. It does not invent ratings, opening hours, prices or accessibility claims. City-reference coordinates and city-atmosphere images are excluded from venue schema.
- Real destination, category and place links support browser-native navigation and modifiers. JavaScript-free visitors get readable source-linked guides inside `noscript`.
- `/about` documents coverage, evidence, attribution and corrections; `/privacy` describes local storage, location permission, map requests, hosting logs and external links.

## AI search and reading

`/llms.txt` links to `/llms-full.txt`, `/guides/...` Markdown, public JSON and source documentation. The full guide includes every catalog venue, its source URLs and check dates, uncertainty, coordinate provenance and image credits. These endpoints are reading aids, **not a promise that an AI service will index the app or cite it**. They do not add an in-app assistant or send visitor conversations to a model provider. Human HTML remains the canonical content; Markdown responses point back to it and use `X-Robots-Tag: noindex, follow` to avoid duplicate indexing.

## Release verification and recovery

- `/api/health` returns `status` and the build's public commit `revision` (or `null` for local builds). Only validated commit identifiers are exposed; no credentials or diagnostics appear there.
- Production deployment smoke checks can use the public alias only after its health revision matches the deployment's SHA, and verify it again while checking routes. This avoids testing an older successful deployment when unique production URLs have Vercel protection. Preview smoke checks still require the repository's `VERCEL_AUTOMATION_BYPASS_SECRET`.
- CI runs formatting, lint, TypeScript, data audit, production build, browser regressions, SEO/structured-data/Markdown/card checks and automated WCAG checks on mobile and desktop. Existing dependency, secret scanning and CodeQL workflows remain in place.
- Route and root failures show recovery actions; invalid catalog relationships return a real 404. Street-map import, tile or WebGL failures retain an external map link and directions. Photo dialogs have accessible names.

## Owner setup before calling launch complete

These steps require service ownership or legal decisions and cannot be completed solely in application code:

1. Verify the production property in Google Search Console and Bing Webmaster Tools; submit `https://citylit.vercel.app/sitemap.xml`. Validate representative place and collection pages with the respective URL inspection and Schema.org validator tools. Search ranking and rich results are not guaranteed.
2. Keep Vercel system environment variables enabled so `VERCEL_GIT_COMMIT_SHA` is available at build time. Add Vercel's automation bypass secret to GitHub Actions if protected preview smoke checks should pass. Never disable preview protection just to make checks green.
3. Enable the main-branch protection/ruleset documented in [repository automation](repository-automation.md). The coding integration currently lacks repository-admin permission to apply it. Require CI, security checks and review; keep changes on reviewed PRs.
4. Supply the operating entity and appropriate privacy/contact details, and have the privacy notice and POPIA obligations reviewed for the actual operator. Current public issue links are operational contact, not a fabricated legal identity.
5. Set up external uptime/error monitoring and ownership of alerts. No analytics or exception-reporting service is currently activated; `/privacy` explicitly reflects that. If a provider is added, update that notice, configure consent where required, redact personal/location data, and keep credentials server-only.
6. Review source refresh results before publishing them. Crawled source pages are not live venue confirmation. Confirm unknown accessibility, opening hours and entrances with venues; do not turn unknown fields into asserted facts. Continue honoring third-party photo and map licenses.
7. Choose a custom domain when ready and update `SITE_URL`, crawler/sitemap URLs, social cards, deployment allowlists and identity tests together. Add redirects from the Vercel hostname to avoid duplicate indexing.

Accessibility automation covers selected representative flows; it does not replace manual keyboard, VoiceOver/TalkBack, reduced-motion and device testing. The street map uses OpenStreetMap public tiles; respect their usage policy and choose a suitable tile service before traffic outgrows that policy.

## Browser and ingestion security

HTML uses a fresh server-owned CSP nonce and private/no-store caching; inline event handlers and production eval are disallowed. Public data, local photos, scripts, Markdown and sharing cards retain caching. Animated inline styles remain allowed for the interaction libraries. Maintenance fetches validate public destinations and redirects, enforce byte/pixel limits and use hash-locked Pillow. See the [security audit](security-audit-2026-10-08.md) for verification, performance tradeoffs and operator requirements.
