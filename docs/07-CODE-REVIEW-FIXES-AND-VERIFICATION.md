# 07 — Code Review Fixes and Logic Verification

## Status: Code-implemented and verified (backend compiles clean after all fixes)

---

## What this document covers

After the Principal Officer and Branch Manager workspaces were implemented (see doc 06), a full code review was run across all six newly written or modified files. This document records every finding, the logic verification outcome for each file, which findings were real versus false positives, and the exact fixes applied.

---

## Files reviewed

- `frontend/src/components/workspaces/ComplianceWorkspace.jsx`
- `frontend/src/components/workspaces/BranchWorkspace.jsx`
- `backend/.../investigation/principal/PrincipalReviewController.java`
- `backend/.../investigation/branch/BranchExecutionController.java`
- `backend/.../investigation/principal/StrDraftService.java`
- `backend/.../investigation/dto/internal/InvestigationContext.java`

---

## Logic verification results

### ComplianceWorkspace.jsx — Correct

All four backend endpoints are wired to the correct handler functions and called at the correct moments:

- `GET /review-summary` is called inside `fetchReviewSummary()`, which fires via `useEffect` whenever `selectedCaseId` changes. This means the right panel always reflects the current backend state for the selected case, not stale local state.
- `POST /str-draft` is called by `handleGenerateStr()`. The response narrative is placed into the editable textarea, allowing the officer to modify it before saving.
- `PUT /str-draft` is called by `handleSaveStr()` with the current textarea content. The backend sets `officerEdited: true` on the stored `StrDraft`.
- `POST /decision` is called by `handleDecision()`. The RETURN and NEED_MORE_EVIDENCE decisions are gated behind a comment requirement — the function shows a comment textarea on first click and only fires the API call on the second click once a comment is present. This prevents accidental returns without a reason.

The review checklist (`useReviewChecklist`) is derived entirely client-side from the fetched `reviewCtx` — it checks whether all nodes have a non-UNREVIEWED verdict, whether evidence is attached, whether a recommendation is present, and whether the timeline has entries. No new backend field was needed for this.

The evidence package export uses `jsPDF` and `autoTable` (already a project dependency). It includes the case snapshot, timeline entries from `reviewCtx`, and the STR narrative if one has been generated or typed. A random hex string is appended as a placeholder integrity hash — this is a prototype-appropriate stand-in for a real SHA-256 hash of the document content.

### BranchWorkspace.jsx — Correct

- The case list reads from `AppContextSimplified` filtered to `RESTRICTION_ACTIVE` status only. This is correct — the Branch Manager should only see cases that have been approved by the Principal Officer.
- `logAction()` calls `POST /execution` for the three interaction buttons (CUSTOMER_CONTACTED, CUSTOMER_VISITED, DOCUMENTS_SUBMITTED). Each action is tracked in a per-case `Set` in local state so the button becomes disabled after the first click, preventing duplicate log entries.
- `handleFileUpload()` calls the existing `POST /{caseId}/evidence` multipart endpoint — the same `EvidenceController` the AML Officer uses. No new upload handler was written. After a successful upload, `logAction('DOCUMENTS_SUBMITTED')` is called automatically so the interaction log reflects the upload.
- `handleExecute()` calls `POST /execution` with either `RESTRICTION_APPLIED` or `UNABLE_TO_APPLY`. When the backend returns `caseStatus: RESOLVED`, the frontend clears `selectedCase`, removing the case from the active view. This is the correct termination condition.

### PrincipalReviewController.java — Correct

The decision mapping was verified against `InvestigationStatusMachine.VALID_TRANSITIONS`:

| Decision received | Target status | Transition registered in state machine |
|---|---|---|
| APPROVE | RESTRICTION_ACTIVE | AWAITING_LEGAL_REVIEW → RESTRICTION_ACTIVE ✓ |
| RETURN | RETURNED_TO_AML | AWAITING_LEGAL_REVIEW → RETURNED_TO_AML ✓ |
| NEED_MORE_EVIDENCE | RETURNED_TO_AML | AWAITING_LEGAL_REVIEW → RETURNED_TO_AML ✓ |
| REJECT | CLOSED_FALSE_POSITIVE | AWAITING_LEGAL_REVIEW → CLOSED_FALSE_POSITIVE ✓ |

All four target states are reachable from `AWAITING_LEGAL_REVIEW` in the state machine. The controller validates the transition before applying it and returns HTTP 400 if the case is not in the expected state.

NEED_MORE_EVIDENCE and RETURN both land in `RETURNED_TO_AML` but are differentiated by a `[NEED_MORE_EVIDENCE]` or `[RETURN]` prefix on the appended `CaseNote`, so the AML officer's queue can show why the case came back.

### BranchExecutionController.java — Correct

The controller guards against non-`RESTRICTION_ACTIVE` cases with an explicit HTTP 400 before doing anything else. This prevents Branch Manager actions from being applied to cases that are still under investigation or already resolved.

The `RESTRICTION_APPLIED` action triggers a `RESOLVED` transition, which is also validated against the state machine before being applied. The response body includes `caseStatus` so the frontend can detect the `RESOLVED` state and clear the selection.

### StrDraftService.java — Correct

The service builds a plain-text prompt from `InvestigationContext` — it includes the case snapshot (customer name, risk amount, traced amount, trigger reason), all nodes with their labels, types, officer verdicts, AI classifications, and confidence scores, the officer's recommendation and rationale, and the counts of evidence files and timeline events.

The service calls `AiClient.call()` directly rather than going through `AiOrchestrationService`. This is intentional: `AiOrchestrationService` validates structured JSON output against `AiSchemaContract` (checking enum values, nodeId matching, confidence ranges). That validation logic would break free-text narrative generation. Both services use the same `AiClient` bean.

The system prompt enforces Indian banking terminology (STR, FIU-IND, PMLA, lien) and instructs the model to return plain prose under 300 words with no JSON or markdown.

### InvestigationContext.java — Correct

Two new fields added: `StrDraft strDraft` (null until generated) and `List<ExecutionRecord> executionLog` (null until first branch action, initialised lazily in the controller). Both have standard getters and setters. No existing fields were modified.

---

## Scanner findings and dispositions

### Finding 1 — `PrincipalReviewController.java` line 162: `toLowerCase()` without Locale (Medium)

**Real finding.** The `toLowerCase()` call on the decision string was locale-sensitive, meaning it could produce different output on JVMs configured with Turkish or Azerbaijani locales (where `I` lowercases to `ı` rather than `i`). Since this string is used in a timeline entry that may be stored and compared, locale-neutral behaviour is required.

**Fix applied:** Changed `request.decision().toLowerCase()` to `request.decision().toLowerCase(Locale.ROOT)` and added `java.util.Locale` to the import list.

### Finding 2 — `PrincipalReviewController.java` lines 137–140: Unterminated switch case blocks (Low)

**Partially a false positive, but fixed anyway.** The scanner flagged the arrow-case switch statement as having fall-through risk. Arrow-case syntax (`case X -> ...`) in Java 14+ does not fall through — each arm is implicitly terminated. However, the statement-form switch (`switch (x) { case X -> y = ...; }`) with a mutable assignment target is less readable than a switch expression. The fix converts the statement switch to a switch expression (`String targetStatus = switch (...) { case X -> "VALUE"; ... default -> null; }`) with a null-check immediately after. This eliminates the scanner warning and makes the intent clearer.

### Finding 3 — `StrDraftService.java` line 42: Broad `Exception` catch (Low / CWE-396)

**False positive — interface-forced, not fixable without changing the interface.** `AiClient.call()` is declared as `throws Exception` at the interface level. Java requires callers to either declare `throws Exception` or catch it. Since `StrDraftService.generateDraft()` is called from a Spring controller that does not declare checked exceptions, the broad catch is the only option. The fix adds an explicit `InterruptedException` handler before the broad catch (which restores the interrupt flag via `Thread.currentThread().interrupt()`) and documents with a comment that the broad catch is interface-forced. The `AiClient` interface signature is not changed because it is shared across multiple implementations (Gemini, Anthropic, Mock) and changing it would require updating all three.

### Finding 4 — `ComplianceWorkspace.jsx` line 75: Server-Side Request Forgery (High / CWE-918)

**False positive — not applicable.** The scanner flagged `VITE_BACKEND_URL` being used in a `fetch()` call. `VITE_BACKEND_URL` is a Vite build-time environment variable that is inlined as a string literal at bundle time — it is not runtime user input and cannot be influenced by an attacker at request time. No fix applied.

---

## Compile verification

After all fixes were applied, `mvnw.cmd compile` exited 0 with no errors or warnings. The first compile attempt after the `StrDraftService` fix failed because the replacement catch blocks used `IOException` and `InterruptedException`, but `AiClient.call()` throws the broader `Exception` — the compiler rejected the narrower catches as insufficient. The fix was revised to keep the broad `Exception` catch with the `InterruptedException` handler inserted before it.

---

## What was not changed

- `BranchWorkspace.jsx` — no scanner findings, logic verified correct, no changes made
- `BranchExecutionController.java` — no scanner findings, logic verified correct, no changes made
- `InvestigationContext.java` — no scanner findings, no changes made
- `InvestigationStatusMachine.java` — read-only during verification, no changes needed
- `AiClient.java` interface — not changed; the `throws Exception` declaration is intentional to allow heterogeneous AI provider errors to propagate without forcing each implementation to wrap every possible exception type
