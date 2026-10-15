# Correction review and publication

Visitors can save a sourced correction from any place page. The draft remains in that browser; it does not edit a listing. The saved draft offers a prefilled GitHub issue form and a copy option. Long reports use the copy option rather than an oversized URL. The visitor signs into GitHub, reviews the public report, and submits it. Citylit never submits an issue on their behalf or places a repository token in the browser.

`/editorial` lists drafts from the current browser. It supports public report preparation, local review status, export, rejection and deletion. Storage failures keep the previous state and show an error. A local “reviewed” flag is a personal organizational aid, not maintainer approval. Deleting a draft does not delete an issue already submitted to GitHub.

## Maintainer publication checklist

1. Triage reports in [the issue tracker](https://github.com/thembaxx/citylit/issues). Confirm the place ID and the public source. A report's creation date is not evidence of when the source was checked.
2. Prefer the operator, municipality or responsible institution. Record the date you actually checked the source. Keep conflicting, unavailable or undated information qualified; do not turn an unknown entrance or accessibility claim into a verified fact.
3. Open a catalog pull request. Update the affected record in `public/data/places.json`. For changes to seeded description, address or website, also update the matching entry in `scripts/catalog.json` so enrichment retains the correction. Practical facts carry `value`, `source`, `checkedAt` and `confidence`; update the specific fact's date rather than implying that every fact was reverified.
4. For photographs, retain the license, author, source and local asset requirements. A city photograph must remain labelled as city context. Pin changes need geographic evidence; a venue coordinate does not establish an entrance.
5. Run `pnpm data:audit`, `pnpm typecheck` and `pnpm build`, inspect the affected page and its source link, and review the PR checks. Catalog refresh PRs require the same editorial review and must preserve more recent facts and additions.
6. Merge the reviewed change, confirm the deployed revision and production smoke check, then close the original issue with the publication reference. Rejected reports should receive a factual reason from the maintainer.

This workflow uses GitHub's existing authenticated issue and pull-request system. It requires a maintainer to verify and publish changes. There is no Citylit account database, anonymous submission API or automatic publication of visitor-provided data.
