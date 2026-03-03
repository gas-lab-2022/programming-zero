# Decision Log

## 1. Integration test mock data corrected for per-tag-search pattern

- **Context**: The integration test `tests/integration/pipeline.test.ts` used single objects `{ id: N, name: 'xxx' }` for tag search responses in test 1, and a single array containing all 3 tags in a single mock response for tests 2 and 3. However, the WordPress infrastructure implementation (validated by unit tests) sends one `GET /wp/v2/tags?search=xxx` request **per tag**. The responses must be arrays (WP REST API collection format).
- **Options considered**:
  (a) Normalize responses in `wordpress.ts` to handle both array and single-object formats
  (b) Fix the integration test mocks to match the expected per-tag-search contract
- **Rationale**: Option (b) is correct. Adding format normalization in production code would introduce a fallback/defensive pattern prohibited by the coding policy. The unit tests for `wordpress.ts` clearly specify arrays as the search response format. The integration test mock data was simply incorrect. Fixed:
  - Test 1: Changed `{ id: 10 }` → `[{ id: 10 }]`, `{ id: 11 }` → `[{ id: 11 }]` for search responses
  - Tests 2 & 3: Added 3 individual per-tag search responses + 1 post response (4 total instead of 2)

## 2. `process.env` non-null assertion (`!`) for WordPress config in `generateAndPublish`

- **Context**: `generateAndPublish` loads `WP_SITE_URL`, `WP_USERNAME`, `WP_APP_PASSWORD` from `process.env`. TypeScript types these as `string | undefined`. The integration tests do not set these env vars, but they stub `fetch` globally so the actual URL values do not matter.
- **Options considered**:
  (a) Throw if env vars are missing (Fail Fast) — would break integration tests
  (b) Use `!` non-null assertion — TypeScript is satisfied, runtime produces `'undefined/wp-json/...'` strings that the mocked `fetch` accepts
  (c) Create a `.env.test` file with dummy values
- **Rationale**: Option (b) is adopted. The CLI (`src/cli.ts`) loads dotenv before invoking the pipeline, making the vars available in production. For tests, the mocked `fetch` accepts any URL string. The `!` assertion is appropriate because the module contract assumes dotenv has been loaded by the time `generateAndPublish` is called. Option (c) would require modifying the vitest config or adding a test setup file, which is outside this task scope.

## 3. Sequential tag resolution (not `Promise.all`) in `publishPost`

- **Context**: The tag resolution loop processes each tag with separate API calls (search + optional create). Using `Promise.all` would execute all tag searches concurrently, making the mock call order non-deterministic.
- **Options considered**:
  (a) `Promise.all` — concurrent, faster, but non-deterministic mock ordering breaks unit tests
  (b) `for...of` sequential loop — deterministic order matches `mockResolvedValueOnce` sequence
- **Rationale**: Option (b). Unit tests rely on `mockResolvedValueOnce` calls being consumed in a specific order. Sequential processing ensures each tag's search and optional create calls consume the correct mock responses. Performance difference is negligible for the typical use case (2–10 tags per article).
