# Review Policy

Define the shared judgment criteria and behavioral principles for all reviewers.

## Principles

| Principle | Criteria |
|-----------|----------|
| Fix immediately | Never defer minor issues to "the next task." Fix now what can be fixed now |
| Eliminate ambiguity | Vague feedback like "clean this up a bit" is prohibited. Specify file, line, and proposed fix |
| Fact-check | Verify against actual code before raising issues. Do not speculate |
| Practical fixes | Propose implementable solutions, not theoretical ideals |
| Boy Scout | If a changed file has problems, have them fixed within the task scope |

## Scope Determination

| Situation | Verdict | Action |
|-----------|---------|--------|
| Problem introduced by this change | Blocking | REJECT |
| Code made unused by this change (arguments, imports, variables, functions) | Blocking | REJECT (change-induced problem) |
| Existing problem in a changed file | Blocking | REJECT (Boy Scout rule) |
| Structural problem in the changed module | Blocking | REJECT if within scope |
| Problem in an unchanged file | Non-blocking | Record only (informational) |
| Refactoring that greatly exceeds task scope | Non-blocking | Note as a suggestion |

## Judgment Criteria

### REJECT (Request Changes)

REJECT without exception if any of the following apply.

- New behavior without tests
- Bug fix without a regression test
- Use of `any` type
- Fallback value abuse (`?? 'unknown'`)
- Explanatory comments (What/How comments)
- Unused code ("just in case" code)
- Direct mutation of objects/arrays
- Swallowed errors (empty catch blocks)
- TODO comments (not tracked in an issue)
- Essentially identical logic duplicated (DRY violation)
- Method proliferation doing the same thing (should be absorbed by configuration differences)
- Specific implementation leaking into generic layers (imports and branching for specific implementations in generic layers)
- Internal implementation exported from public API (infrastructure functions or internal classes exposed publicly)
- Replaced code/exports surviving after refactoring
- Missing cross-validation of related fields (invariants of semantically coupled config values left unverified)

### Warning

Not blocking, but improvement is recommended.

- Insufficient edge case / boundary value tests
- Tests coupled to implementation details
- Overly complex functions/files
- Unclear naming
- Abandoned TODO/FIXME (those with issue numbers are acceptable)
- `@ts-ignore` or `eslint-disable` without justification

### APPROVE

Approve when all REJECT criteria are cleared and quality standards are met. Never give conditional approval. If there are problems, reject.

## Fact-Checking

Always verify facts before raising an issue.

| Do | Do Not |
|----|--------|
| Open the file and check actual code | Assume "it should be fixed already" |
| Search for call sites and usages with grep | Raise issues based on memory |
| Cross-reference type definitions and schemas | Guess that code is dead |
| Distinguish generated files (reports, etc.) from source | Review generated files as if they were source code |

## Writing Specific Feedback

Every issue raised must include the following.

- **Which file and line number**
- **What the problem is**
- **How to fix it**

```
❌ "Review the structure"
❌ "Clean this up a bit"
❌ "Refactoring is needed"

✅ "src/auth/service.ts:45 — validateUser() is duplicated in 3 places.
     Extract into a shared function."
```

## Finding ID Tracking (`finding_id`)

To prevent circular rejections, track findings by ID.

- Every issue raised in a REJECT must include a `finding_id`
- If the same issue is raised again, reuse the same `finding_id`
- For repeated issues, set status to `persists` and include concrete evidence (file/line) that it remains unresolved
- New issues must use status `new`
- Resolved issues must be listed with status `resolved`
- Issues without `finding_id` are invalid (cannot be used as rejection grounds)
- REJECT is allowed only when there is at least one `new` or `persists` issue

## Reopen Conditions (`resolved` -> open)

Reopening a resolved finding requires reproducible evidence.

- To reopen a previously `resolved` finding, all of the following are required  
  1. Reproduction steps (command/input)  
  2. Expected result vs. actual result  
  3. Failing file/line evidence
- If any of the three is missing, the reopen attempt is invalid (cannot be used as REJECT grounds)
- If reproduction conditions changed, treat it as a different problem and issue a new `finding_id`

## Immutable Meaning of `finding_id`

Do not mix different problems under the same ID.

- A `finding_id` must refer to one and only one problem
- If problem meaning, evidence files, or reproduction conditions change, issue a new `finding_id`
- Rewriting an existing `finding_id` to represent a different problem is prohibited

## Handling Test File Size and Duplication

Test file length and duplication are warning-level maintainability concerns by default.

- Excessive test file length and duplicated test setup are `Warning` by default
- They may be `REJECT` only when reproducible harm is shown  
  - flaky behavior  
  - false positives/false negatives  
  - inability to detect regressions
- "Too long" or "duplicated" alone is not sufficient for `REJECT`

## Boy Scout Rule

Leave it better than you found it.

### In Scope

- Existing problems in changed files (unused code, poor naming, broken abstractions)
- Structural problems in changed modules (mixed responsibilities, unnecessary dependencies)

### Out of Scope

- Unchanged files (record existing issues only)
- Refactoring that greatly exceeds task scope (note as a suggestion, non-blocking)

### Judgment

| Situation | Verdict |
|-----------|---------|
| Changed file has an obvious problem | REJECT — have it fixed together |
| Redundant expression (a shorter equivalent exists) | REJECT |
| Unnecessary branch/condition (unreachable or always the same result) | REJECT |
| Fixable in seconds to minutes | REJECT (do not mark as "non-blocking") |
| Code made unused as a result of the change (arguments, imports, etc.) | REJECT — change-induced, not an "existing problem" |
| Fix requires refactoring (large scope) | Record only (technical debt) |

Do not tolerate problems just because existing code does the same. If existing code is bad, improve it rather than match it.

## Judgment Rules

- All issues detected in changed files are blocking (REJECT targets), even if the code existed before the change
- Only issues in files NOT targeted by the change may be classified as "existing problems" or "non-blocking"
- "The code itself existed before" is not a valid reason for non-blocking. As long as it is in a changed file, the Boy Scout rule applies
- If even one issue exists, REJECT. "APPROVE with warnings" or "APPROVE with suggestions" is prohibited

## Detecting Circular Arguments

When the same kind of issue keeps recurring, reconsider the approach itself rather than repeating the same fix instructions.

### When the Same Problem Recurs

1. Check if the same kind of issue is being repeated
2. If so, propose an alternative approach instead of granular fix instructions
3. Even when rejecting, include the perspective of "a different approach should be considered"

Rather than repeating "fix this again," stop and suggest a different path.


---

# AI Antipattern Detection Criteria

## Assumption Verification

AI often makes assumptions. Verify them.

| Check | Question |
|-------|----------|
| Requirements | Does the implementation match what was actually requested? |
| Context | Does it follow the existing codebase conventions? |
| Domain | Are business rules correctly understood? |
| Edge Cases | Did the AI consider realistic edge cases? |

Red flags:
- Implementation appears to answer a different question
- Uses patterns not found elsewhere in the codebase
- Overly generic solution for a specific problem

## Plausible-but-Wrong Detection

AI generates code that looks correct but is wrong.

| Pattern | Example |
|---------|---------|
| Syntactically correct but semantically wrong | Validation that checks format but misses business rules |
| Hallucinated APIs | Calling methods that don't exist in the library version being used |
| Stale patterns | Using deprecated approaches from training data |
| Over-engineering | Adding unnecessary abstraction layers for the task |
| Under-engineering | Missing error handling for realistic scenarios |
| Forgotten wiring | Mechanism is implemented but not passed from entry points |

Verification approach:
1. Can this code actually compile/run?
2. Do the imported modules/functions exist?
3. Is the API used correctly for this library version?
4. If new parameters/fields were added, are they actually passed from callers?
   - AI often implements correctly within individual files but forgets cross-file wiring
   - Grep to check if `options.xxx ?? fallback` always uses the fallback

## Copy-Paste Pattern Detection

AI often repeats the same patterns, including mistakes.

| Check | Action |
|-------|--------|
| Repeated dangerous patterns | Same vulnerability in multiple places |
| Inconsistent implementation | Same logic implemented differently across files |
| Boilerplate explosion | Unnecessary repetition that could be abstracted |

## Redundant Conditional Branch Detection

AI tends to generate if/else blocks that call the same function with only argument differences.

| Pattern | Example | Verdict |
|---------|---------|---------|
| Branch differs only in argument presence | `if (x) f(a, b, c) else f(a, b)` | REJECT |
| Branch differs only in options | `if (x) f(a, {opt: x}) else f(a)` | REJECT |
| Redundant else without using return value | `if (x) { f(a, x); return; } f(a);` | REJECT |

```typescript
// REJECT - both branches call the same function, differing only in the 3rd argument
if (options.format !== undefined) {
  await processFile(input, output, { format: options.format });
} else {
  await processFile(input, output);
}

// OK - extract the conditional into a variable, then make a single call
const formatOpt = options.format !== undefined ? { format: options.format } : undefined;
await processFile(input, output, formatOpt);
```

Verification approach:
1. Find if/else blocks calling the same function
2. If the only difference is optional argument presence, unify with ternary or spread syntax
3. If branches have different preprocessing, store results in a variable and make a single call

## Context Fitness Assessment

Does the code fit this specific project?

| Aspect | Verification |
|--------|-------------|
| Naming conventions | Matches existing codebase style |
| Error handling style | Consistent with project patterns |
| Logging approach | Uses project's logging conventions |
| Test style | Matches existing test patterns |

Questions to ask:
- Would a developer familiar with this codebase write it this way?
- Does it feel like it belongs here?
- Are there unexplained deviations from project conventions?

## Scope Creep Detection

AI tends to over-deliver. Check for unnecessary additions.

| Check | Problem |
|-------|---------|
| Extra features | Functionality not requested |
| Premature abstraction | Interfaces/abstractions for single implementations |
| Over-configuration | Making things configurable that don't need to be |
| Gold-plating | "Nice-to-have" additions not asked for |
| Unnecessary legacy support | Adding mapping/normalization logic for old values without explicit instruction |

The best code is the minimum code that solves the problem.

Legacy support criteria:
- Unless explicitly instructed to "support legacy values" or "maintain backward compatibility", legacy support is unnecessary
- Do not add `.transform()` normalization, `LEGACY_*_MAP` mappings, or `@deprecated` type definitions
- Support only new values and keep it simple

## Dead Code Detection

AI adds new code but often forgets to remove code that is no longer needed.

| Pattern | Example |
|---------|---------|
| Unused functions/methods | Old implementations remaining after refactoring |
| Unused variables/constants | Definitions no longer needed after condition changes |
| Unreachable code | Processing remaining after early returns, always-true/false conditions |
| Logically unreachable defensive code | Branches that never execute due to caller constraints |
| Unused imports/dependencies | Import statements or package dependencies for removed features |
| Orphaned exports/public APIs | Re-exports or index registrations remaining after implementation is removed |
| Unused interfaces/type definitions | Old types remaining after implementation changes |
| Disabled code | Code left commented out |

Logical dead code detection:

AI tends to add "just in case" defensive code, but when considering caller constraints, it may be unreachable. Code that is syntactically reachable but logically unreachable due to call chain preconditions should be removed.

```typescript
// REJECT - callers always require interactive input
// This function is never called from non-interactive environments
function displayResult(data: ResultData): void {
  const isInteractive = process.stdin.isTTY === true;
  // isInteractive is always true (callers assume TTY)
  const output = isInteractive ? formatRich(data) : formatPlain(data);  // else branch is unreachable
}

// OK - understands caller constraints and removes unnecessary branching
function displayResult(data: ResultData): void {
  // Only called from interactive menus, so TTY is always present
  console.log(formatRich(data));
}
```

Verification approach:
1. When finding defensive branches, grep to check all callers of the function
2. If all callers already satisfy the condition, the defense is unnecessary
3. Grep to confirm no references to changed/deleted code remain
4. Verify that public module (index files, etc.) export lists match actual implementations
5. Check that no old code remains corresponding to newly added code

## Fallback/Default Argument Overuse Detection

AI overuses fallbacks and default arguments to hide uncertainty.

| Pattern | Example | Verdict |
|---------|---------|---------|
| Fallback on required data | `user?.id ?? 'unknown'` | REJECT |
| Default argument overuse | `function f(x = 'default')` where all callers omit it | REJECT |
| Nullish coalescing with no input path | `options?.cwd ?? process.cwd()` with no way to pass from above | REJECT |
| try-catch returning empty | `catch { return ''; }` | REJECT |
| Multi-level fallback | `a ?? b ?? c ?? d` | REJECT |
| Silent ignore in conditionals | `if (!x) return;` silently skipping what should be an error | REJECT |

Verification approach:
1. Grep the diff for `??`, `||`, `= defaultValue`, `catch`
2. For each fallback/default argument:
   - Is it required data? -> REJECT
   - Do all callers omit it? -> REJECT
   - Is there a path to pass the value from above? -> If not, REJECT
3. REJECT if any fallback/default argument exists without justification

## Unused Code Detection

AI tends to generate unnecessary code for "future extensibility", "symmetry", or "just in case". Code not currently called from anywhere should be removed.

| Verdict | Criteria |
|---------|----------|
| REJECT | Public functions/methods not called from anywhere currently |
| REJECT | Setters/getters created "for symmetry" but not used |
| REJECT | Interfaces or options prepared for future extension |
| REJECT | Exported but no usage found via grep |
| OK | Implicitly called by framework (lifecycle hooks, etc.) |

Verification approach:
1. Grep to confirm no references to changed/deleted code remain
2. Verify that public module (index files, etc.) export lists match actual implementations
3. Check that no old code remains corresponding to newly added code

## Unnecessary Backward Compatibility Code Detection

AI tends to leave unnecessary code "for backward compatibility". Don't miss this.

Code to remove:

| Pattern | Example | Verdict |
|---------|---------|---------|
| deprecated + no usage | `@deprecated` annotation with no one using it | Remove immediately |
| Both old and new APIs exist | Old function remains alongside new function | Remove old, unless both have active usage sites |
| Completed migration wrapper | Wrapper created for compatibility but migration is complete | Remove |
| Comment says "remove later" | `// TODO: remove after migration` left abandoned | Remove now |
| Excessive proxy/adapter usage | Complexity added solely for backward compatibility | Replace simply |

Code to keep:

| Pattern | Example | Verdict |
|---------|---------|---------|
| Externally published API | npm package exports | Consider carefully |
| Config file compatibility | Can read old format config | Maintain until major version |
| During data migration | In the middle of DB schema migration | Maintain until complete |

Decision criteria:
1. Are there usage sites? -> Verify with grep/search. Remove if none
2. Do both old and new have usage sites? -> If both are currently in use, this may be intentional coexistence rather than backward compatibility. Check callers
3. Is it externally published? -> Can remove immediately if internal only
4. Is migration complete? -> Remove if complete

When AI says "for backward compatibility", be skeptical. Verify if it's truly necessary.

## Decision Traceability Review

Verify that the Coder's decision log is valid.

| Check | Question |
|-------|----------|
| Decision is documented | Are non-obvious choices explained? |
| Rationale is sound | Does the reasoning make sense? |
| Alternatives considered | Were other approaches evaluated? |
| Assumptions explicit | Are assumptions explicit and reasonable? |
