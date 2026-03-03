# Change Scope Declaration

## Task
Implement all stub production code to make 54 existing tests pass (TDD green phase)

## Planned changes
| Type | File |
|------|------|
| Modify | `src/infrastructure/claude.ts` |
| Modify | `src/infrastructure/search.ts` |
| Modify | `src/infrastructure/wordpress.ts` |
| Modify | `src/agents/keywordAnalysis.ts` |
| Modify | `src/agents/seoAnalysis.ts` |
| Modify | `src/agents/intentDeepDive.ts` |
| Modify | `src/agents/differentiationDesign.ts` |
| Modify | `src/agents/outlineCreation.ts` |
| Modify | `src/agents/articleGeneration.ts` |
| Modify | `src/pipeline.ts` |
| Create | `src/cli.ts` |
| Create | `.env.example` |
| Create | `docs/architecture.md` |
| Modify | `tests/integration/pipeline.test.ts` (fix incorrect mock setup) |

## Estimated size
Large

## Impact area
- All infrastructure layers (claude, search, wordpress)
- All 6 agent modules
- Pipeline orchestration
- CLI entrypoint
