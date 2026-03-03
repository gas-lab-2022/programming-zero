# Change Scope Declaration

## Task
Write TDD tests for all 6 pipeline stages, infrastructure adapters, and integration flow of the WordPress article generation system

## Planned Changes
| Type | File |
|------|------|
| Create | `package.json` |
| Create | `tsconfig.json` |
| Create | `vitest.config.ts` |
| Create | `src/types/index.ts` |
| Create | `src/infrastructure/claude.ts` (stub) |
| Create | `src/infrastructure/search.ts` (stub) |
| Create | `src/infrastructure/wordpress.ts` (stub) |
| Create | `src/agents/keywordAnalysis.ts` (stub) |
| Create | `src/agents/seoAnalysis.ts` (stub) |
| Create | `src/agents/intentDeepDive.ts` (stub) |
| Create | `src/agents/differentiationDesign.ts` (stub) |
| Create | `src/agents/outlineCreation.ts` (stub) |
| Create | `src/agents/articleGeneration.ts` (stub) |
| Create | `src/pipeline.ts` (stub) |
| Create | `tests/infrastructure/claude.test.ts` |
| Create | `tests/infrastructure/search.test.ts` |
| Create | `tests/infrastructure/wordpress.test.ts` |
| Create | `tests/agents/keywordAnalysis.test.ts` |
| Create | `tests/agents/seoAnalysis.test.ts` |
| Create | `tests/agents/intentDeepDive.test.ts` |
| Create | `tests/agents/differentiationDesign.test.ts` |
| Create | `tests/agents/outlineCreation.test.ts` |
| Create | `tests/agents/articleGeneration.test.ts` |
| Create | `tests/pipeline.test.ts` |
| Create | `tests/integration/pipeline.test.ts` |

## Estimated Size
Large

## Impact Area
- Infrastructure layer: `callAgent` (Claude SDK wrapper), `searchWeb` (Tavily), `publishPost` (WordPress REST API)
- Agent layer: all 6 pipeline stages (keywordAnalysis → seoAnalysis → intentDeepDive → differentiationDesign → outlineCreation → articleGeneration)
- Pipeline orchestrator: step sequencing and data handoff
- Integration: end-to-end flow from keyword to WordPress post result