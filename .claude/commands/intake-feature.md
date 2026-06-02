# Feature Intake

Turn a rough feature idea into a well-specified roadmap entry and update `docs/master-plan.md`.

## Steps

1. **Read context** — read `docs/master-plan.md` and `CLAUDE.md` before asking anything

2. **Understand the idea** — the user will describe a feature. Ask focused clarifying questions to nail down:
   - What problem does this solve or what skill does it build?
   - Where does it live in the app (new screen, drill mode, settings, existing drill)?
   - Any constraints (offline-only, must not break note-finder loop, etc.)?
   - Should it be near-term or later roadmap?

3. **Draft the spec** — write a clear feature description covering:
   - What the user sees and does
   - How it fits into the existing drill loop and navigation
   - What data needs to be persisted (if any)
   - Edge cases or failure modes worth noting
   - Acceptance criteria (what "done" looks like)
   - Test plan (what Jest tests or manual checks confirm it works)

4. **Show the spec** — present it to the user and confirm it matches their intent. Revise until approved.

5. **Update master-plan.md** — add the approved spec to the appropriate roadmap section (Near-Term or Later). Write it in the same concise style as existing roadmap entries, with the full spec detail added as sub-bullets if needed.

6. **If it should be next** — update the `## Next Agent Task` section to point at the new feature with enough detail for a cold agent to implement it without further clarification.

## Output

A confirmed, written roadmap entry in `docs/master-plan.md`. The user can then run `/implement-next` when ready to build it.
