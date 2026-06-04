# Implement Next Feature

Implement the current `## Next Agent Task` from `docs/master-plan.md` following project patterns.

## Steps

1. **Read context** — read `docs/master-plan.md` and `CLAUDE.md` in full before doing anything else

2. **Confirm the task** — summarize the Next Agent Task back to the user in 2–3 sentences. If anything is ambiguous or missing, ask for clarification. **Wait for the user to explicitly confirm before proceeding to any implementation steps.** Do not assume approval.

3. **Explore before planning** — read the relevant source files to understand existing patterns:
   - Check `src/domain/` for any domain types that need extending
   - Check `src/services/` for service changes
   - Check `src/store/usePracticeSession.ts` for state changes
   - Check the relevant `app/` screen(s) for UI context

4. **Plan** — enter plan mode and design the implementation:
   - Follow the existing layered architecture: domain → services → store → components → screens
   - Reuse existing components and utilities — do not duplicate
   - Identify which tests need to be added or updated

5. **Implement** — execute the plan layer by layer, verifying each layer before moving on:
   - Write or update domain types first (pure TS, testable in Node)
   - Run `npm test` after domain/service changes to confirm nothing broke
   - Wire up store changes
   - Build or update UI last

6. **Test** — run `npm test` and confirm all tests pass. Add new tests for any logic that isn't already covered.

7. **Update master-plan.md**:
   - Move the completed task into `## Completed Capabilities`
   - Set `## Next Agent Task` to the next logical roadmap item, with enough detail for a cold agent
   - If no obvious next task exists, leave a clear placeholder and note it for the user

8. **Commit** — stage and commit all changes with a clear message describing what was implemented.

## Constraints

- Do not break existing note-finder behavior
- Keep the app offline-only — no network calls
- Do not introduce new native dependencies without noting that an `eas build` will be required
- UI must remain usable on phone-sized portrait screens
