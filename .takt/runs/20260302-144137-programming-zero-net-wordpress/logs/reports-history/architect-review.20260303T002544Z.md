# Architecture Review

## Result: REJECT

## Summary
F004 persists — no regression tests for the two `resolveTagId()` error paths added by the F002 fix. A001 is new — `generateAndPublish()` in the agent layer reads `process.env` directly to build `WordPressConfig`, and that config-building behavior is completely untested.

## Reviewed Aspects
- [x] Structure & design
- [x] Code quality
- [x] Change scope
- [x] Test coverage
- [x] Dead code
- [x] Call chain verification

## Current Iteration Findings (new)
| # | finding_id | Scope | Location | Issue | Fix Suggestion |
|---|------------|-------|----------|-------|----------------|
| 1 | A001 | In-scope | `src/agents/articleGeneration.ts:41-45` | Agent layer reads `process.env` to construct `WordPressConfig` (Hidden Dependencies anti-pattern; layer violation). The env-to-config mapping is new behavior with zero test coverage — `tests/agents/articleGeneration.test.ts:91` only destructures `content`, never verifies the `config` argument passed to `publishPost`. | Add `config: WordPressConfig` as second param to `generateAndPublish`; thread it through `runPipeline(keyword, config)`; construct config once in `cli.ts`. Add assertion on `mockPublishPost.mock.calls[0]![1]` in article generation tests. |

## Carry-over Findings (persists)
| # | finding_id | Previous Evidence | Current Evidence | Issue | Fix Suggestion |
|---|------------|-------------------|------------------|-------|----------------|
| 1 | F004 | `tests/infrastructure/wordpress.test.ts` — no tests for `wordpress.ts:23-26, 41-44` | Same file, same gap confirmed. 6 tests total; none mock an error response for the tag-search or tag-create `fetch` calls. No match for `'WordPress tag search failed'` or `'WordPress tag creation failed'` in any test file. | `resolveTagId()` error paths (`!searchRes.ok`, `!createRes.ok`) uncovered — bug fix without regression test. | Add two tests using the existing `errorResponse()` helper: (1) mock tag-search `fetch` with `errorResponse(401, …)`, expect reject matching `'WordPress tag search failed'`; (2) mock tag-search with `jsonResponse([])` then tag-create `fetch` with `errorResponse(403, …)`, expect reject matching `'WordPress tag creation failed'`. |

## Rejection Gate
REJECT — F004 (`persists`) + A001 (`new`), both with valid `finding_id`s.