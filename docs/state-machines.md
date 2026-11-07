# CityLit state-machine audit

> Audit snapshot: 2026-11-07  
> Repository: `thembaxx/citylit`  
> Audited ref: `main` at `0f1209c72edf15597a7c84faf6876490a3705e5e`  
> Branch for this document: `audit/citylit-state-machines`  
> Status: initial source audit; confirmed defects are tracked below. This is not a claim that every component has been exhaustively modeled or that fixes have shipped.

This document is the single source of truth for explicit and implicit application state machines, their invariants, transitions, reachable invalid states, evidence, fixes and regression coverage. Update it in the same change as every state-machine fix.

## 1. Scope and method

Reviewed source paths include:

- `components/useDiscovery.ts`, `components/AdventureHub.tsx`, `components/PlanVisit.tsx`
- `lib/client-data.ts`, `lib/adventure.ts`
- `lib/itinerary-feasibility.ts`, `components/ItineraryFeasibility.tsx`
- `components/PwaProvider.tsx`, `lib/pwa.ts`, `public/sw.js`, `public/offline.js`
- `components/KhweziProvider.tsx`, `components/useDelight.ts`, `components/DiscoveryHome.tsx`, `components/PlacesBrowser.tsx`, `components/LandmarkSheet.tsx`

Evidence is classified as:
- **Confirmed reachable defect**: source paths demonstrate a concrete execution that violates an invariant or loses user data.
- **Risk / needs reproduction**: concurrency or lifecycle ordering is possible from the implementation but needs a deterministic regression test before being called a shipped bug.
- **Invariant enforced**: validation/guards in source currently prevent the invalid state.

## 2. State machine inventory

| Domain | State owner | Persisted? | Main transitions |
|---|---|---:|---|
| Discovery document | `useDiscovery` / localStorage | Yes | save, unsave, visit, unvisit, add/remove/reorder itinerary, passport, essential motion |
| AdventureHub view | `AdventureHub` React state + URL | Partly | destination, tab, mood, time, budget, suggestion variant, nearby location, shared trip |
| Itinerary feasibility | `ItineraryFeasibility` + localStorage | Yes | load, edit settings, request route, accept/reject response, clear |
| PWA registration/update | `PwaProvider` | Browser-managed | unsupported/registering/ready/waiting/reloading/reload-ready/error |
| Offline guide worker | `public/sw.js` Cache Storage | Yes | install, activate/migrate, save guide, status, clear photos, offline navigation |
| Offline guide UI | `public/offline.js` + URL | Yes | saved/day/all, filter, detail, save, visit, add/remove stop |
| Khwezi delight | `KhweziProvider` / `useDelight` | Partly | welcome, motion, visibility, celebration, sound/haptics |
| Guide navigation/search | URL + component state | URL | query/category filters, browser back/forward, detail links |
| Landmark sheet | parent selection + `LandmarkSheet` | No | open, close, Escape, navigate to details |

## 3. Discovery document state machine

**Source:** `components/useDiscovery.ts`, `lib/client-data.ts`.

### States

The discovery document is a normalized value:

- `saved: string[]`
- `visited: string[]`
- `itinerary: string[]`
- `passport: boolean` (defaults to `true`)
- `essential: boolean` (defaults to `false`)

The hook exposes the current normalized snapshot and a synchronous `update(change)` operation. The backing key is `citylit-discovery-v2`; `mzansi-saved` is a compatibility mirror/fallback.

### Invariants

1. Every ID must exist in the place catalog.
2. Each list contains unique IDs.
3. Itinerary length is at most `MAX_TRIP_STOPS = 30`.
4. An itinerary is intended to contain stops from one city.
5. Saved and visited are independent sets; saving is not equivalent to visiting.
6. `passport` and `essential` are booleans.
7. Storage failure must not be reported as a successful persisted update.
8. Concurrent mutations must not silently discard an independent committed mutation. **Not currently guaranteed across tabs.**

### Transition table

| Current state | Event | Guard | Next state / side effect |
|---|---|---|---|
| Any valid document | `SAVE(id)` | Catalog ID | Add ID to saved, unique |
| Any valid document | `UNSAVE(id)` | — | Remove ID from saved |
| Any valid document | `VISIT(id)` | Catalog ID | Add ID to visited, unique |
| Any valid document | `UNVISIT(id)` | — | Remove ID from visited |
| Itinerary | `ADD_STOP(id)` | Same city, not already present, fewer than 30 | Append ID |
| Itinerary | `REMOVE_STOP(id)` | — | Remove ID |
| Itinerary | `REORDER(ids)` | IDs are valid and preserve itinerary invariants | Replace order |
| Itinerary | `CLEAR_DAY` | — | Empty itinerary |
| Any valid document | `SET_PASSPORT(bool)` | Boolean | Replace passport preference |
| Any valid document | `SET_ESSENTIAL(bool)` | Boolean | Replace essential-motion preference |
| Any state | malformed storage | Parse/normalization boundary | Normalize to defaults; oversized/malformed JSON uses fallback |
| Any state | storage write throws | — | Return `false`; do not announce persistence success |

### Reachable invalid states and defects

**D-1 — Collection application silently truncates a day (confirmed, P1).**

The Collections handler in `components/AdventureHub.tsx` unions `state.itinerary` with `c.placeIds`, calls `update({ itinerary: ... })`, and changes to the Day tab without checking the resulting count or the write result. `lib/client-data.ts` then normalizes the list with `ids(input.itinerary, MAX_TRIP_STOPS)`, which silently truncates after 30. The catalog has collections of two and three stops. A 28-stop day plus a three-stop collection therefore reaches a 31-stop candidate and silently loses one selected stop.

Tracking issue: [#108](https://github.com/thembaxx/citylit/issues/108).

**D-2 — Cross-context read/modify/write can lose updates (confirmed concurrency defect, P1).**

`useDiscovery.update` reads the latest localStorage snapshot, computes a merged document, then writes it. localStorage provides atomic individual operations, not an atomic read-modify-write transaction across tabs. Two tabs can both read revision A, independently produce B and C, then write B followed by C; B's independent change is lost. The offline page has a second implementation: module-level arrays are loaded by `readState()` and the entire document is written later by `writeState()`. A storage event refreshes the other tab after a write but cannot prevent the lost-update interleaving.

In addition, object patches built from render-time `state` (for example the collection union, save/visit toggles, reordering and removal in `AdventureHub.tsx`) can replace a newer list with a stale list. The functional updater form is safer for deriving changes from the latest snapshot, but it does not make the cross-tab localStorage transaction atomic.

Tracking issue: [#109](https://github.com/thembaxx/citylit/issues/109).

## 4. AdventureHub view and trip-planning state

**Source:** `components/AdventureHub.tsx`, `lib/adventure.ts`, `lib/client-data.ts`.

### States

- Destination: one catalog city slug; initialized from `?city=`, otherwise first city.
- Tab: `discover | collections | day | passport`; `?trip=` selects day, and only day/passport are accepted from `?tab=`.
- Suggestion inputs: mood, duration, budget, variant.
- Nearby lookup: `origin = null | [longitude, latitude]`, `busy`, `geoStatus`.
- Incoming shared discovery: parsed only when URL resolves to a known catalog place.
- Shared itinerary: parsed IDs are known, unique, capped at 30 and filtered to the requested city.
- Message: transient status text cleared after 4.5 seconds.

### Invariants

1. Destination must be one of the catalog city slugs.
2. Tab must be one of the four known tab IDs.
3. A day must remain within one city and contain at most 30 unique catalog IDs.
4. A share import must discard unknown IDs and IDs outside the imported trip's city.
5. Geolocation is opt-in; only venue-accuracy coordinates are used for nearby discovery.
6. Route estimates require two or more valid venue pins; no missing leg is treated as zero.

### Transition table

| Current state | Event | Guard | Next state |
|---|---|---|---|
| Any tab | `SELECT_CITY(city)` | City is in catalog | Update city; clear nearby origin |
| Any tab | `SELECT_TAB(tab)` | Known tab | Change tab |
| Discover | `CHANGE_PREFERENCES` | UI select options | Recompute suggestions |
| Discover | `NEXT_SUGGESTIONS` | — | Increment variant |
| Discover | `REQUEST_LOCATION` | Geolocation API available | busy=true; success sets origin; failure clears busy and sets status |
| Discover | `ADD_STOP(id)` | Not duplicate, same city, under 30 | Append itinerary |
| Collections | `MAKE_COLLECTION_DAY` | Existing day empty or same city | Union collection IDs into itinerary; currently missing cap check and success/error handling |
| Day | `IMPORT_SHARED_TRIP` | At least one parsed known ID | Filter to first stop's city, replace itinerary, set destination |
| Day | `GROUP_NEARBY` | Non-empty trip | Reorder verified venue pins by distance; approximate pins at end |
| Day | `MOVE_STOP` | Neighbor index exists | Swap adjacent IDs |
| Day | `REMOVE_STOP` | Stop exists | Remove ID |
| Day | `CLEAR_DAY` | — | Empty itinerary |
| Passport | `TOGGLE_PASSPORT/ESSENTIAL` | Boolean | Persist preference |
| Passport | `DOWNLOAD_GUIDE` | No waiting/reload-ready update | Send SAVE_GUIDE to active worker; report complete/partial/failure |
| Any | `SHARE(ids)` | Browser share or clipboard | Native share or copy; AbortError is silent; other errors expose URL |

### Known guards and limits

- `parseSharedTrip` caps imports at 30 and filters IDs to the requested city.
- `add(id)` checks duplicate, city and 30-stop limit before writing.
- `normalizeDiscovery` enforces catalog membership, uniqueness and the 30-stop cap, but its truncation is silent; it is a defensive normalizer, not a user-facing transition guard.
- Collection application is the confirmed exception: see D-1.

## 5. Itinerary-feasibility state machine

**Source:** `lib/itinerary-feasibility.ts`, `components/ItineraryFeasibility.tsx`, `app/api/itinerary/route.ts`.

### States

- Load: `unloaded | loading | loaded(key, settings) | load-error` (the UI represents loading/error with `loaded` and `error`).
- Route request: `idle | busy(requestId) | success | failure | stale-discarded`.
- Settings: version 1, SAST date, start time, budget, per-place visit durations, opening evidence, directed travel legs.
- Persistence: one localStorage document with at most eight keyed plans.

### Invariants

1. A plan key is a sorted unique set of place IDs; presentation order is separate.
2. Date must be a real YYYY-MM-DD date.
3. Start time must be valid and not 24:00.
4. Budget and entered durations/travel minutes are bounded integer minute values.
5. Opening evidence applies to an explicit date; unknown evidence is not treated as open.
6. Route estimate must contain exactly `places.length - 1` finite non-negative legs, a non-empty source and valid timestamp.
7. A response for an obsolete itinerary order must not update current settings.
8. Manual travel edits made while a request is pending must not be overwritten by that request.
9. At most eight plans are persisted.
10. Cross-tab plan updates must not overwrite independent plans. **Not currently guaranteed.**

### Transition table

| Current state | Event | Guard | Next state / side effect |
|---|---|---|---|
| Unloaded | `LOAD(key)` | Effect not cancelled | Load valid settings or defaults; mark writable only on successful parse |
| Loaded | `EDIT_SETTINGS` | UI input | Update in-memory settings and attempt save |
| Loaded | `REQUEST_ROUTE` | Callback exists, >=2 venue pins, not busy | Increment request ID; set busy |
| Busy | `ROUTE_SUCCESS` | Request ID still current; response shape valid; same plan key | Apply only legs unchanged since request start; persist |
| Busy | `ROUTE_FAILURE` | Request ID still current | Show error; return idle |
| Busy | `ORDER_CHANGED` | Effect observes changed order key | Increment request ID; obsolete response is ignored |
| Loaded | `CLEAR_SETTINGS` | User confirms | Remove plan settings; current screen values remain until changed/reopened |
| Any | malformed stored document | Validation fails | Preserve stored bytes; use defaults with write disabled |

### Reachable invalid states and defects

**F-1 — Multi-tab plan writes can overwrite or resurrect settings (confirmed concurrency defect, P2).**

`saveFeasibility` and `clearFeasibility` both read the entire plans array, mutate it locally, and write the entire document. Two tabs can interleave these operations and lose a different plan's edit or restore a plan another tab cleared. `ItineraryFeasibility` does not subscribe to cross-tab storage changes or compare revisions.

Tracking issue: [#110](https://github.com/thembaxx/citylit/issues/110).

### Existing concurrency protections

`ItineraryFeasibility` increments `requestId` when the stop order changes, ignores stale request responses, checks the current plan key, and compares each route leg against the settings captured when the request began. This is a meaningful guard against late responses overwriting manual edits. Keep these protections and add deterministic tests before refactoring.

The API validates same-origin requests, JSON content type, payload size, 2–12 coordinate pairs, finite coordinate values and geographic bounds. Upstream OSRM requests use a 10-second timeout, no-store caching and redirect rejection; failure returns 503 rather than fabricated zero legs.

## 6. PWA registration and update state machine

**Source:** `components/PwaProvider.tsx`, `lib/pwa.ts`.

### States

- Capability: unsupported / supported.
- Registration: not-started / registering / registered / registration-error.
- Installation: browser / install-prompt-available / installed / manual-install.
- Update: no-waiting-worker / waiting / reloading / reload-ready / update-error.
- Connectivity: online / offline.
- Guide status: textSaved boolean + photoCount.

### Invariants

1. Registration only occurs in production, on a secure context, when service workers are supported.
2. The install prompt is invoked only after a user action; the one-shot event is consumed before awaiting.
3. An update request must target the currently waiting worker.
4. A successful controller change for the requested worker clears the timeout/error; reload occurs only if the user still wants a reload.
5. A 12-second timeout stops the spinner but retains worker identity so late activation can be reconciled.
6. Offline state must not imply that an update can be applied.
7. Guide status failures must not block the application.

### Transition table

| Current state | Event | Guard | Next state |
|---|---|---|---|
| Not started | provider mount | Production + secure + SW support | Registering |
| Not started | provider mount | Capability/environment fails | Unsupported + registration message |
| Registering | register resolves | Provider still mounted | Registered; observe waiting/installing worker |
| Registering | register rejects | Provider still mounted | Registration error |
| Browser | beforeinstallprompt | Event received | Install prompt available |
| Prompt available | install click | Prompt still present | Consume prompt; prompt; accepted/dismissed/manual |
| Any | appinstalled | — | Installed; clear prompt |
| Registered | updatefound | — | Observe installing worker |
| Installing | installed with existing controller | — | Waiting |
| Waiting | apply update | Online and waiting worker exists | Reloading; post SKIP_WAITING; start 12s timeout |
| Reloading | controllerchange matches requested worker | — | Clear timer/error; reload if wantsReload |
| Reloading | timeout | No matching controllerchange yet | Update error; retain requested worker identity |
| Update error | late matching controllerchange | — | Clear error; no automatic reload after timeout |
| Any | online/offline event | — | Update connectivity; refresh guide status when online |

## 7. Service-worker cache and offline guide state machine

**Source:** `public/sw.js`, `public/offline.js`, `lib/pwa.ts`.

### Cache states

- Install: populate current version's core cache; first install activates normally, update waits for explicit SKIP_WAITING.
- Activate: migrate photo entries from previous CityLit caches; retain an old cache if migration fails; claim clients.
- Guide: text cached / partial photos / full selected photos.
- Navigation: network response (including real 4xx) / cached offline guide / 503 fallback.
- Message: SAVE_GUIDE / GUIDE_STATUS / CLEAR_PHOTOS / SKIP_WAITING.

### Invariants

1. Only same-origin GET requests are intercepted; non-GET and cross-origin requests pass through.
2. RSC/nonce HTML, health endpoints and map tiles are not cached.
3. Only known core assets and strict hashed photo paths are cacheable by the runtime fetch handler.
4. User-selected guide IDs are deduplicated and capped at 30.
5. A photo failure may produce text-only success; it must not be reported as a complete photo download.
6. Clearing photos preserves guide text and local discovery state.
7. Each page-to-worker request uses its own MessageChannel and bounded timeout.
8. Worker response must include boolean `ok` and `textSaved`; malformed responses reject.

### Transition table

| Current state | Event | Guard | Next state / side effect |
|---|---|---|---|
| Uninstalled | install | — | Populate core cache |
| Installed old worker | new worker install | — | Populate new version cache; wait |
| Waiting | SKIP_WAITING | Same origin | Activate |
| Activating | activate | — | Migrate photos, delete successfully migrated old caches, claim clients |
| Online | navigation | — | Network; preserve responses below 500 |
| Offline/network failure | navigation | — | Cached offline page or 503 text fallback |
| Guide not saved | SAVE_GUIDE(ids) | Same origin; IDs normalized | Refresh core; fetch first image for each selected place; report partial/full result |
| Any | GUIDE_STATUS | Same origin | Count text and photos across current/retained caches |
| Any | CLEAR_PHOTOS | Same origin | Delete photos from all CityLit caches; preserve text |
| Page request pending | worker response | Valid message schema | Resolve request and close port |
| Page request pending | timeout | No response before 45s (save) / 5s (status/clear) | Reject and close port |

### Concurrency review

Worker requests use independent MessageChannels, so replies are correlated per request. Cache writes and deletes are asynchronous and there is no explicit per-cache operation queue. In particular, concurrent SAVE_GUIDE and CLEAR_PHOTOS requests can interleave. This is recorded as **needs deterministic reproduction**, not a confirmed user-visible bug, until a test demonstrates an incorrect final cache state or misleading result. Add a worker-level concurrency test before changing the protocol.

## 8. Offline guide UI state machine

**Source:** `public/offline.js`.

### States

- Mode: `saved | day | all`.
- Selection: empty or known place ID in the hash.
- Filters: city, category and query.
- Data: in-memory arrays for saved, visited and itinerary, hydrated from localStorage.
- URL: `?view=...`, optional city/category/query, optional hash selection.

### Transition table

| Current state | Event | Guard | Next state |
|---|---|---|---|
| Any | load | — | Read localStorage; restore URL filters/selection |
| Any | select mode | Known mode | Reset selection and filters; sync URL; render |
| Any | change filter | — | Clear selection; sync URL; render |
| List | open place | Known catalog ID | Set hash; render detail |
| Detail | save/unsave | — | Mutate in-memory saved list; write full document; render |
| Detail | add/remove stop | Same city, unique, under 30 | Mutate itinerary; write full document |
| Detail | mark visited | — | Mutate visited list; write full document |
| Any | popstate | — | Restore URL and render |
| Any | storage event | — | Re-read storage and render |

The offline guide shares the online discovery key but duplicates the persistence implementation. Its stale in-memory arrays are part of D-2's lost-update path.

## 9. Khwezi motion, delight and transient UI state

**Source:** `components/KhweziProvider.tsx`, `components/useDelight.ts`, `components/DiscoveryHome.tsx`.

### States and invariants

- Motion is active only when the animation preference is on, essential motion is off, reduced motion is not requested, and the document is visible.
- Welcome is loaded from `citylit-khwezi-met`; dismiss writes the marker.
- Celebration is a single transient moment, only while visible, cleared after 3.6 seconds.
- Sound is session-only and starts off.
- Haptics default on and persist as `citylit-haptics`; unsupported/denied browser APIs must not interrupt user actions.
- Feedback is throttled to one event per 75ms.

### Transition table

| Current state | Event | Guard | Next state |
|---|---|---|---|
| Motion still | visibility/preferences allow | animations && !essential && !reduced && visible | Motion play |
| Motion play | hidden / essential / reduced / disabled | Any condition fails | Motion still |
| Welcome unknown | hydration effect | localStorage marker absent/unreadable | Welcome shown |
| Welcome shown | dismiss | — | Hide and persist marker |
| No moment | save/offline celebration | Document visible | Show moment |
| Moment shown | timeout / next moment | 3.6s / replacement | Clear or replace moment |
| Sound off | toggle | User gesture | Sound on; feedback attempt |
| Haptics on/off | toggle | — | Flip and persist preference |

## 10. Navigation, search and overlays

**Source:** `components/PlacesBrowser.tsx`, `components/LandmarkSheet.tsx`, `components/PlaceContext.tsx`, `components/DiscoveryHome.tsx`.

| Domain | States | Events / transitions | Invariant |
|---|---|---|---|
| PlacesBrowser | URL query `q`, category; derived result list | Input/filter uses `history.replaceState`; clear resets query/category; browser navigation is URL-driven | Results are always derived from current city + URL filters |
| DiscoveryHome | selected city index or null; Khwezi pose | select/reset city; toggle mascot pose | Index must resolve to a catalog city before rendering a city card |
| LandmarkSheet | closed / open for one landmark | parent selection opens; close button, backdrop or Escape closes; details link closes | Only one selected landmark sheet at a time; Escape listener removed on unmount |
| PlaceContext | collapsed / expanded | More/Less toggles | Expansion is local presentation state, not persisted |

The sheet focuses its close button on mount and registers an Escape listener. A full focus trap and focus restoration are not implemented in this component itself; verify whether the parent/dialog primitive supplies them before classifying that as a defect.

## 11. Prioritized confirmed defects and issue grouping

| Priority | Finding | Impact | Evidence | Issue |
|---|---|---|---|---|
| P1 | Collection transition silently truncates stops beyond 30 | User loses selected stops without feedback | AdventureHub collection handler + `normalizeDiscovery` + collection catalog | [#108](https://github.com/thembaxx/citylit/issues/108) |
| P1 | Discovery localStorage read/modify/write is not cross-tab atomic; offline client rewrites stale whole-document state | Saved places, visits or trip changes can be lost | `useDiscovery.ts`, `AdventureHub.tsx`, `offline.js` | [#109](https://github.com/thembaxx/citylit/issues/109) |
| P2 | Feasibility settings document is read/modify/write without cross-tab serialization | Plan edits can be lost or cleared plans resurrected | `itinerary-feasibility.ts`, `ItineraryFeasibility.tsx` | [#110](https://github.com/thembaxx/citylit/issues/110) |

## 12. Regression coverage required

The current suite has broad happy-path coverage in `tests/adventure.spec.ts` and `tests/pwa.spec.ts`, but the following race/limit cases are not present in the reviewed tests.

| Test ID | Scenario | Expected invariant |
|---|---|---|
| SM-DISC-01 | Apply 3-stop collection to a 28-stop day | Reject atomically; keep all 28; explicit message |
| SM-DISC-02 | Apply 3-stop collection to a 27-stop day | Exactly 30 unique stops |
| SM-DISC-03 | Duplicate IDs in collection union | Duplicates consume no capacity |
| SM-DISC-04 | Two contexts add different saved IDs concurrently | Both IDs survive |
| SM-DISC-05 | Online and offline clients mutate different fields concurrently | Both field changes survive |
| SM-DISC-06 | Rapid add/remove/reorder with two contexts | Unique IDs, <=30 stops, one city |
| SM-FEAS-01 | Two contexts save different plan keys concurrently | Both plans survive |
| SM-FEAS-02 | Clear one plan while another context saves another | Cleared plan stays cleared; new plan survives |
| SM-FEAS-03 | Concurrent edits to same plan | Defined conflict policy; valid document |
| SM-FEAS-04 | Route response arrives after reorder | Stale response ignored |
| SM-FEAS-05 | Manual leg edit while route request pending | Manual edit wins |
| SM-PWA-01 | SAVE_GUIDE and CLEAR_PHOTOS interleave | Final cache and response semantics are deterministic |
| SM-PWA-02 | Worker never responds | Request rejects at documented timeout and releases channel |
| SM-PWA-03 | Worker replies with malformed payload | Request rejects; UI does not report success |

## 13. Fix and verification log

| Date | Change | Tests | Status |
|---|---|---|---|
| 2026-11-07 | Initial audit and issues #108–#110 created | Source review only; no local test execution available in this session | Audit in progress |

**Do not mark a defect fixed until** its implementation, focused regression test, relevant type/lint/build checks and browser-level verification are complete. Update the finding, transition table and verification log in the same PR.
