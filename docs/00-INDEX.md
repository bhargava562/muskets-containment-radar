# Muskets / PFCE — Documentation Index

**IOB Cybernova 2026, Problem Statement 2**

This `docs/` set exists to keep four things separated that kept getting blended together in earlier drafts: the *problem*, the *proposed solution*, the *evidence backing both*, and the *actual state of the code*. Judges (and future you, mid-Q&A) should be able to tell at a glance which of these four categories any given claim belongs to.

| File | Answers | Confidence |
|---|---|---|
| [`01-PROBLEM-STATEMENT.md`](./01-PROBLEM-STATEMENT.md) | What exact gap is being solved, and why "MuleHunter already exists" doesn't dissolve the problem | Evidence-backed, see doc 03 |
| [`02-SOLUTION.md`](./02-SOLUTION.md) | What Muskets/PFCE actually is, its design principles, roles, and business framing | Product concept — partially validated, partially still a hypothesis pending the bank-staff survey |
| [`03-RESEARCH-EVIDENCE.md`](./03-RESEARCH-EVIDENCE.md) | Every legal, regulatory, and statistical claim used above, tiered by confidence, with an explicit exclusion list of fabricated/unverifiable citations | Source-tiered (🟢/🟡/🔴) |
| [`04-DETECTION-MODULE-IMPLEMENTATION.md`](./04-DETECTION-MODULE-IMPLEMENTATION.md) | Full details of the implemented backend detection module, engine logic, and docker deployment | Code-implemented and verified |
| [`05-AML-OFFICER-INVESTIGATION-WORKBENCH.md`](./05-AML-OFFICER-INVESTIGATION-WORKBENCH.md) | Re-architected investigation flow, tab ordering rationale, blocking DISPUTED reason, audit log, and enriched DTOs | Code-implemented and verified |

## Reading order

If you're prepping for a judged Q&A, read in order: **01 → 02 → 04 → 05 → 03** (problem → solution → detection engine → investigation workbench → what backs it up, for spot-checking). If you're fact-checking a specific slide claim, go straight to **03** and search for the claim.

## Standing rules for updating these docs

- Anything added to `01` or `02` that makes a legal, regulatory, or statistical claim must have a corresponding entry added to `03` with a confidence tag — no exceptions, this is how the 🔴 exclusion list in `03` got built in the first place (from claims that *didn't* survive this check).
- `04` should be re-verified against the actual repo before every major demo, not assumed current from a prior pass — code drifts faster than documentation.
- Survey data status (currently **0 responses**, sent 26-04-2026) governs how confidently `02-SOLUTION.md`'s product hypotheses can be stated. Update that section's framing as responses arrive — hypotheses that get contradicted by real investigator feedback should be marked, not silently dropped.
