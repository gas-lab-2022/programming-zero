# Decision Log

## 1. Stub source files created alongside test files
- **Context**: TypeScript requires module resolution to type-check `import` statements at compile time; production implementation files don't exist yet in the write_tests movement
- **Options considered**: (a) `declare module` ambient declarations in a `.d.ts` file, (b) Stub source files with function signatures throwing `Error('Not implemented')`, (c) Accept build failures and only check for syntax errors manually
- **Rationale**: Stub files (option b) match standard TDD practice, are supported by all tooling without special configuration, and make the contract explicit. The implement movement can directly replace the stub bodies with real logic without touching signatures

## 2. `as unknown as Query` cast for claude-agent-sdk mock implementations
- **Context**: The SDK's `Query` interface extends `AsyncGenerator<SDKMessage, void>` but adds 13+ control methods (`interrupt`, `setPermissionMode`, `setModel`, etc.). Plain async generator functions returned from `mockImplementation` don't satisfy the full `Query` type
- **Options considered**: (a) `as any` cast — prohibited by coding policy, (b) `as unknown as Query` two-step cast, (c) Implement a full `Query` shim class with all methods as no-ops
- **Rationale**: Option b is idiomatic TypeScript for test doubles — the explicit `unknown` intermediate is safer than `any` (prevents accidental misuse) and far less verbose than a full shim. A helper `asQuery()` function is defined once and reused across all mock implementations for DRY compliance

## 3. Integration tests included (data flow crosses 3+ modules)
- **Context**: The testing policy requires integration tests when "data flow crosses 3+ modules". The pipeline routes keyword → 6 agents → callAgent/searchWeb/publishPost → external APIs, crossing well over 3 module boundaries
- **Options considered**: (a) Unit tests only with all modules mocked, (b) Unit tests plus integration tests mocking only external boundaries (claude-agent-sdk, @tavily/core, fetch)
- **Rationale**: Option b was selected per policy. Unit tests verify individual module contracts; integration tests verify that the wiring between modules is correct. The integration test mocks only the three external I/O boundaries and lets all internal TypeScript code execute, validating that the pipeline correctly sequences all 6 stages and passes data between them

## 4. `as unknown as ReturnType<typeof tavily>` for Tavily mock
- **Context**: `TavilyClient` exposes 8 methods (`search`, `searchQNA`, `searchContext`, `extract`, `crawl`, `map`, `research`, `getResearch`). Test doubles only implement `search`
- **Options considered**: (a) `as any`, (b) `as unknown as ReturnType<typeof tavily>`, (c) Implement all 8 methods as `vi.fn()` stubs
- **Rationale**: Option b for the same reasons as the Query cast decision. Tests only exercise `search`, so implementing the other 7 methods would be unused code — prohibited by coding policy