# Foama-wien: Fahrzeuge im Anflug investigation

12 November 2026. All clock times below use Europe/Vienna. Baseline: deployed PWA 0.11.14, source 19c264a2f667f087d569858a0dd5a270b9c9602f. Repairs prepared in PWA 0.11.15. Wear 0.7.4 / code 26 is unchanged.

## Implementation follow-up: PWA 0.11.16

The accepted repairs are implemented. Findings below describe the dated baseline. Cache-aware scheduling uses source timestamp + 31 seconds, at least request start + 30 seconds and backoff. Web Locks atomically claim request turns where supported. Identical batches and supplemental-feed requests share in-flight operations per Worker instance. Application code 316 receives a 60-second cooldown across changed scopes. Different overlapping batches and separate instances still have no distributed coordinator.

ETA corrections with two unchanged planned station keys preserve confidence. The original last position is held with its original age until forecasts catch up; no invented forward or backward movement. Reversed on-stop order still invalidates identity. Existing surface journeys may continue with two exact shared anchors; new journeys still need three. Two fresh downstream anchors can support only one adjacent uncertain approach segment after two-source confirmation. Readiness separates future starts, unplaced confirmed journeys, actual outside-range positions and omitted boards. Panels use only the submitted direction subset.

| Same recordings, 250-ms replay | Before | After |
| --- | --- | --- |
| Tram 46 first drawable position | 75.3 s | 41.3 s |
| Tram 46 sampled interval with any position | 75.1% | 87.3% |
| Full U6 south sampled time with any held marker | 57.4% | 38.6% |
| U3 slice time with any held marker | 52.7% | 36.1% |
| 48A slice time with any held marker | 32.0% | 19.9% |

These are model replay comparisons from the same measured receipt times, not physical accuracy or fleet-completeness measurements. Cache timing is separately tested end to end against the relay with an eight-second upstream delay and timed cache: the second call gets a new source without a wasted cached poll or sub-30-second interval. Raw diagnostic captures are excluded from public source.

All 14 enabled Floridsdorf catalogue lines appear in a four-column marker grid. Walking maps render immediately, fetch routing independently and abort/remove on close or background. A new session rejects old route/module responses. Routing failure or absent start keeps the station map. Preview used manually selected public stations, not actual device GPS. After an environment reset, source was restored and validation repeated before publication.

Verification: 453 web/server tests, 18 Python checks and 85 syntax checks. Wear 0.7.4/26 unchanged. Physical Android location, vehicle counts and push delivery remain separate checks.

## 1. Findings and outcome

The sampled failure is mainly a freshness and position-inference problem. The investigation found no evidence that Wiener Linien was throttling these requests. A successful departure response can still yield no drawable vehicle, and a new HTTP response can contain an unchanged cached source snapshot.

| Finding | Evidence | Outcome |
| --- | --- | --- |
| Cached snapshots delay confirmation | 6 of 18 monitor responses repeated the previous source timestamp | Vehicle polling repair proposed |
| Ordinary forecast corrections interrupt tracking | Full U6 replay produced 8 correction events; several vehicles became gray together | Tracker repair proposed |
| Cold start needs positional evidence as well as identity confirmation | First drawable position took 41-75 seconds in the bounded replays | Startup model and wording need improvement |
| GPS map initialization crashes | Existing fresh GPS fixture caused a Leaflet parentNode exception | Fixed in 0.11.15 |
| Disruption source age was reset on receipt | A 120-second-old fixture appeared zero seconds old | Fixed in 0.11.15 |
| Failed supplementary feed could erase an alert | Partial failed response changed one retained warning to zero | Fixed in 0.11.15 |

The distinction matters: 36 candidate journeys on a line are not 36 vehicles currently on the displayed track. The source supplies future departures, including services that have not entered the sampled area. Nor can the observed marker count establish how many physical trains were actually operating: no independent on-site vehicle count was collected.

The map and disruption fixes preserve the 30-second client gate, maximum 24 requested RBLs, existing two-source confirmation, local favorites and the native release. No vehicle matching or polling algorithm change is included in 0.11.15. The proposals in section 5 are separate work.

## 2. Live evidence and caching

Two bounded captures used the real production relay between 08:14:43 and 08:23:39. Each capture made one monitor request approximately every 31 seconds. The first covered all 23 U6 departure platforms toward Siebenhirten. The second used one 24-RBL request containing six-platform slices of U6, U3, tram 46 and bus 48A. These slices are diagnostic samples, not a claim to have tested all 165 supported lines.

| Capture | Calls | HTTP / source result | Duplicate snapshots | Complete requested coverage |
| --- | --- | --- | --- | --- |
| Full U6 southbound | 8 | All 200 / messageCode 1 | 3 / 8 | 23 / 23 each time |
| Four-line slices | 10 | All 200 / messageCode 1 | 3 / 10 | 6 / 6 per line each time |

No sampled response contained HTTP 403, HTTP 429 or Wiener Linien error 316. Calls completed in 4.50-10.32 seconds in this cloud environment. Those durations include this environment's network path and must not be presented as phone latency. A separate limited production-log sample contained 59 monitor invocations: 58 HTTP 200 and one canceled request. Its successful Worker execution times were roughly 0.06-1.73 seconds. This is a sample, not a complete traffic census.

The cache key contains the whole sorted stop-ID batch. The Worker stores a response for 30 seconds after fetching it. The client starts its next request 30 seconds after its previous request started. With network/upstream latency, that next request can reach the cache before its entry expires. It receives the old foamaMonitorAt/serverTime, which the tracker correctly refuses to count as a second source observation.

Concrete U6 sequence: request 08:14:43 received source 08:14:52; request 08:15:14 received the same source; request 08:15:45 finally received source 08:15:50. First drawable positions appeared about 68.3 seconds after the first request started in a 250-ms rendering replay. Across the capture, distinct source updates were separated by approximately 33-62 seconds despite 31-second request starts.

The relay's 30-second cache therefore helps reduce upstream load but conflicts with the current polling schedule. A browser no-store request does not bypass the Worker's explicit server-side cache. Counting duplicate replies twice would conceal the problem and weaken evidence, so that is not a suitable repair.

## 3. Why departures do not become visible vehicles

The current pipeline is: validate route/calendar/platform mapping; normalize live departures; group observations into a journey; confirm it in two distinct source snapshots; derive a current position; filter it to the selected direction and range; render it. Passing an earlier step does not guarantee a position at the final step.

| Sampled direction | Requested platforms | First drawable position | Typical sampled visible positions after warm-up |
| --- | --- | --- | --- |
| U6 toward Siebenhirten | 23 | 68.3 s | 10-12 on the full sampled line |
| U6 toward Floridsdorf | 6 | 41.3 s | 0-1 in the slice |
| U3 toward Simmering | 6 | 41.3 s | 2-3 in the slice |
| 46 toward Parlament/Volkstheater | 6 | 75.3 s | 1, sometimes 2 in the slice |
| 48A toward Parlament/Volkstheater | 6 | 41.3 s | 0-1 in the slice |

Times are model replay results using measured receipt times and the actual tracker, not measured physical vehicle positions. A continuous 250-ms view update was used because positions can become drawable between HTTP responses.

U-Bahn matching requires an unambiguous GTFS planned-time slot within 60 seconds, at least two station anchors to create a track, and two source snapshots. Bus/tram matching requires at least three compatible live planned-time anchors, a valid same-variant travel-time profile and two source snapshots. Continuing a surface identity requires at least two shared actual station/planned-time keys; building its current chain still needs three anchors.

At cold start, the feed predominantly contains future departures. A journey can be confirmed but have no past departure anchor or usable current segment. U6/U3 supplied onStop fields in the sample; the inspected tram 46 and bus 48A vehicle objects did not. Surface startup therefore relies more heavily on accumulating usable temporal anchors. Near a slice boundary there may be too few remaining stations to construct a new chain.

The tracker blocks and resets hits to one when a new estimated position moves backward by more than 0.15 station intervals. A changed arrival prediction can trigger this without any physical reversal or identity conflict. The full U6 rendering replay recorded eight such corrections and 21 gap events. At least one held marker existed during 57% of its sampled rendering interval, including startup in the denominator. Prediction uncertainty is real; treating every such correction as renewed identity uncertainty is unnecessarily disruptive.

Positions freeze after 60 seconds without fresh evidence and disappear after 90 seconds without a matching update. This interacts badly with 60-second distinct-source cadence. Some disappearances are nevertheless justified: the final northbound U6 slice still had forecasts, but the next departure at its first platform was about eight minutes away. Empty space is not proof of a missing operating train.

## 4. Request frequency, coverage and diagnostic gaps

The official fair-use guidance asks for only the stops needed for personal information and intervals of at least 15 seconds. Foama uses a more conservative 30-second client interval and up to 24 requested RBLs. The inspected client paths share a localStorage timestamp, stop hidden work and honor retry delays. The station vehicle panel joins the existing monitor request rather than running another poller.

There are still scaling and observability weaknesses:

- The server cache is keyed by an exact stop batch. Overlapping batches, different devices and different edge locations can fetch the same platforms independently. There is no server-wide minimum interval or in-flight coalescing in the monitor path.
- The localStorage read/check/write sequence is not atomic across tabs. Two tabs can both pass the gate before either writes its timestamp. Requests from a phone and watch also do not share browser storage.
- A global cooldown is cached after upstream HTTP 403/429, but that is different from proactive shared scheduling. Application-level error 316 should also have a distinct bounded backoff path.
- Primary station platform IDs precede vehicle-neighbor IDs, then the combined list is truncated to 24. At a large interchange this can reduce the vehicle chain's usable coverage. The tracker is told its desired IDs rather than the precise final submitted subset, so an intentional budget reduction can look like a source omission.
- Only the selected direction, variant and explicit line section are polled. A line advertised as supported does not mean both directions and the whole network are being tracked simultaneously. Long lines use user-selected overlapping sections.
- Readiness counts future confirmed journeys. Its 'outside your excerpt' explanation can be selected even when those journeys have no position at all. Confirmation and present-position availability need separate diagnostics.

These are code-audit findings and future load risks. They are not evidence that rate limiting caused this user's current symptom. Increasing polling frequency would add load without solving a missing positional anchor, chain ambiguity or forecast correction.

## 5. Recommended solutions and acceptance criteria

| Priority | Change | Acceptance criterion |
| --- | --- | --- |
| 1 | Coordinate polling with source/cache expiry | Every normal confirmation cycle obtains a newer source without any client request interval below 30 s |
| 1 | Keep identity confidence separate from ordinary ETA corrections | Same planned-anchor journey retains its ID through bounded forecast updates; impossible/reversed station evidence still blocks it |
| 1 | Report the real positional state | Separate future confirmed journey, waiting for a usable segment, held position, outside range and budget-limited coverage |
| 2 | Pass the actual submitted RBL subset into the panel | Requested, returned and usable platform counts agree in interchange and 24-ID overflow tests |
| 2 | Improve cold-start and edge-of-slice inference | More vehicles become drawable from two independent compatible sources without forced matches or fabricated live movement |
| 3 | Add shared server request coordination | Concurrent and overlapping clients reuse recent platform data; bounded cooldowns apply to HTTP and application-level rate limits |

For priority 1, favor a server-provided next-fresh timestamp or scheduling from a validated source timestamp plus the cache lifetime and a small expiry margin, while retaining the existing request-start gate and backoff. Check this end to end with simulated upstream latency and the real Worker cache. Merely scheduling 30 seconds after HTTP completion can avoid some repeats but reintroduces unnecessary network-latency delays. Simply reducing cache TTL also increases multi-client upstream load unless coordinated.

For tracker corrections, preserve the hypothesis when planned station anchors remain identical. Hold a location or widen its uncertainty until the revised forecast catches up; do not animate invented forward progress. Reserve renewed identity confirmation for genuine conflicting anchors, impossible order or ambiguous reassignment. Validate the thresholds against recordings with delays, short turns and tight headways.

For cold start, compare the existing profile with a constrained multi-station time fit after two independent sources. Any additional position should explicitly retain estimated/uncertain status and an evidence bound. Do not use departure rank as a physical vehicle identifier, remove the two-source rule, or inflate schedule tolerances indiscriminately.

For server coordination, a bounded per-platform memory/cache and in-flight request sharing are possible first steps. A shared lease/coordinator would address multiple instances more reliably. Only displayed scopes should drive requests; no continuously polling network collector or stored vehicle history is proposed.

Release order: source/cache coordination and truthful diagnostics first, then correction continuity, then cold-start/coverage improvements, followed by load coordination. Repeat a full-line U-Bahn and representative surface test before rollout, and compare at least one run with actual station observations.

## 6. Standort map failure and repair

The production Standort tile opened a functioning map when a manual station was selected. This did not reproduce the GPS-specific condition. A separate local browser test used the shipped Leaflet library and a clearly synthetic fix at a public Vienna point, with 12 m accuracy and no device-location request.

Before the repair, providing that fix before L.map(...).setView(...) failed with: TypeError: Cannot read properties of undefined (reading 'parentNode'). The stack ran through Leaflet _bringToBack, the location overlay render callback, its synchronous position-source subscription and the map init hook.

The location source immediately delivers an already available fix on subscription. The init hook subscribed before the first map view had initialized the SVG paths. Sorting the accuracy circle or marker at that point accessed an uncreated path and aborted map construction. This explains why the empty-map symptom depends on whether a real fix is already available.

The fix installs the overlay from map.whenReady(...), after center, zoom and the initial layer lifecycle are ready. The same real-library browser test then initialized the map, showed the blue dot and accuracy circle, and successfully removed/reopened it without GPS. A regression test protects the initialization boundary. Manual-location rendering with real OpenStreetMap tiles was separately checked in production.

The Standort and routed walking-map tile requests now also use the existing origin-only Referrer-Policy used by the other maps. OpenStreetMap requires a valid Referer from web pages. The adjustment sends the public origin without a page path, query or fragment. It was a separate consistency issue, not the reproduced parentNode crash.

Files: pwa/src/map-position.mjs (installMapPositions), pwa/src/app.mjs (tile-layer options), tests/map-position.test.mjs. This verifies a browser/library repair; a physical Android GPS session remains a separate device check.

## 7. Störungsmeldungen upgrade and remaining boundaries

The production health endpoint and pages reported 0.11.14 at the start. The 0.11.13 connection-warning placement and 0.11.14 A-to-B integration were present in the source. The fixed official trafficInfoList and Foama's /api/disruptions both responded successfully. At approximately 08:20:43, the official response included eight long operational notices; Foama's normalized response contained 42 non-expired/non-resolved notices in total. The extra notices include equipment and stop-specific information, not 42 current line disruptions.

A real U4 connection at Karlsplatz displayed 'U4: Verspätungen' directly below station/line/direction and before departures. A separate U4 Karlsplatz-to-Hütteldorf journey showed the same alert above the route controls and travel sections; its station detail showed it below the station/line heading and before departures. Automated regressions also cover route-variant filtering, multiple transit legs, deduplication, expired/resolved alerts and preserving mounted walking/vehicle maps.

Two defects in the common cache were independently reproduced and repaired:

- Age: updateTrafficCache stamped records with local receipt time. A response whose source was already 120 seconds old appeared freshly checked. Records now use the conservative older valid monitor/feed timestamp. Re-fetching the same source cannot make it newer.
- Failure: when the supplementary line feed failed, a successful monitor response with no matching alert could overwrite an existing line warning with an empty list. An explicitly incomplete feed now merges retained alerts while preserving their older checkedAt, until the existing 15-minute retention or explicit expiry/resolution. A complete successful empty refresh can still remove an alert.

The source-age approach is conservative: a fresh monitor notice can inherit the older supplementary-feed age. It avoids claiming that every merged notice was independently refreshed now. The tests cover both defects and successful empty-refresh behavior.

The connected disruption service reported available=true, state=ok, with lastCheck=lastSuccess at 08:06:33.750 during the initial check; the saved hourly task remained enabled. That verifies source processing/readiness. No new push test was sent, and this investigation does not establish physical Android notification delivery. PWA web push remains distinct from native watch push.

GitHub main was still 0.10.2 and draft PR #6 was 0.11.13 while production was 0.11.14. The existing draft is the continuation point for source synchronization, rather than treating main's older version as the deployed application.

## 8. Verification, reproducibility and sources

Prepared repairs passed 435 web/server tests, 18 Python import/helper tests and 82 JavaScript syntax checks. The unchanged public Wear APK was restored and matched its existing 3,842,666-byte size and SHA-256 1f31df225182e95b6c46979c09b8b180f12a8df0abb44aac10ce6550dcaa833a. Temporary synthetic map pages and raw diagnostic captures are excluded from the release/source archive.

Reproduce the investigation with the deployed matching timetable version and bounded monitor requests. Record request start/receipt and upstream source timestamps separately. Normalize the responses for the exact direction and actual submitted IDs, then render the tracker between responses. Count current positions, held positions and future-only journeys separately. Repeat across several headways and compare to an independent station observation before claiming spatial accuracy or fleet completeness.

Important code entry points:

- cloudflare/src/index.js: proxyMonitor, apiCache, withLineNotices.
- pwa/src/vehicle-poller.mjs: request-start scheduling, shared gate, timeout/backoff.
- pwa/src/vehicle-tracker.mjs: normalization, stationChainBundles, ingest, vehiclePosition and view.
- pwa/src/vehicle-strip.mjs: panel scope and lifecycle; vehicle-readiness.mjs: status classification.
- pwa/src/app.mjs and journey-page.mjs: union/truncation of monitor scopes and common traffic cache.
- pwa/src/traffic-info.mjs: source age, partial-feed retention and warning relevance.

Primary external references:

- [Official Wiener Linien API documentation, version 1.4, 09.02.2026](https://www.wienerlinien.at/ogd_realtime/doku/ogd/wienerlinien-echtzeitdaten-dokumentation.pdf): departure-monitor contract, optional real times and error 316.
- [Official Austrian open-data catalog / Stadt Wien](https://www.data.gv.at/katalog/dataset/cfba4373-a654-3e0b-80f8-348738169f95): personal-scope fair use and minimum 15-second query interval.
- [Leaflet 1.9.4 reference](https://leafletjs.com/reference-1.9.4.html#map-whenready): first-view readiness lifecycle.
- [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/): web Referer and normal cache behavior.
- [Live vehicle feature](https://foama-wien.endruuu.chatgpt.site/fahrzeuge.html), [disruptions](https://foama-wien.endruuu.chatgpt.site/alerts.html), [public source draft PR #6](https://github.com/andrew01ait/foama-wien/pull/6).

Limits: one morning window; five direction/scopes; no exhaustive per-line validation, peak-versus-off-peak comparison, physical train count, Android location trace or push delivery test. The diagnosis separates reproduced defects, observed source behavior and proposed solutions. Repairs in 0.11.15 address the map and disruption cache; the vehicle algorithm proposals remain pending.
