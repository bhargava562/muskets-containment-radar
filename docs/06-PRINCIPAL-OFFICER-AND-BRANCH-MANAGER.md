# 06 — Principal Officer & Branch Manager Implementation

## Status: Code-implemented and verified (backend compiles clean, frontend builds clean)

---

## What this document covers

The two downstream roles in the MUSKETS workflow — Principal Officer (Compliance) and Branch Manager — were previously wired to `AppContextSimplified` (the mock localStorage context) and contained US-centric terminology (`SAR`, `DPIP`) that would fail any AML compliance review. This document records what was built, why each decision was made, and what the scope boundaries are.

---

## Terminology corrections applied (applied first, as a standalone change)

| Was (wrong) | Now (correct) | Regulatory basis |
|---|---|---|
| `SAR`, `Suspicious Activity Report` | `STR`, `Suspicious Transaction Report` | PMLA Section 12, FIU-IND reporting mandate |
| `generateSARPdf`, `isGeneratingSAR`, `sarGenerated` | `generateStrDraft`, `isGeneratingStr`, `strDraftGenerated` | Same |
| `DPIP Interbank Packet`, `generateDPIPPdf` | `Case Evidence Package`, `handleExportEvidencePackage` | DPIP is a real RBI/I4C system — reusing the acronym for an internal export bundle was a naming collision |
| `Legal & Principal Officer` (role label) | `Principal Officer (Compliance)` | Matches Indian bank org structure; "Legal" implies a separate legal department role |

Files changed: `LoginPage.jsx`, `SideNav.jsx`, `MainLayout.jsx`, `ComplianceWorkspace.jsx`.

---

## Backend additions

### New DTOs

**`StrDraft`** (`investigation/dto/internal/StrDraft.java`)
```
narrative      — the AI-generated or officer-edited STR text
generatedAt    — ISO-8601 timestamp
officerEdited  — true if the officer modified the AI draft
status         — DRAFT | APPROVED
```

**`ExecutionRecord`** (`investigation/dto/internal/ExecutionRecord.java`)
```
recordId    — exec_<uuid8>
action      — CUSTOMER_CONTACTED | CUSTOMER_VISITED | DOCUMENTS_SUBMITTED | RESTRICTION_APPLIED | UNABLE_TO_APPLY
note        — free text
recordedBy  — "Branch Manager"
timestamp   — ISO-8601
```

Both added as new fields on `InvestigationContext`:
- `StrDraft strDraft` — null until Principal Officer generates it
- `List<ExecutionRecord> executionLog` — appended by Branch Manager actions

**New request DTOs:**
- `PrincipalDecisionRequest(decision, comment)` — decision: APPROVE | RETURN | REJECT | NEED_MORE_EVIDENCE
- `ExecutionUpdateRequest(action, note)`

### New packages

```
investigation/
├── principal/
│   ├── PrincipalReviewController.java
│   └── StrDraftService.java
└── branch/
    └── BranchExecutionController.java
```

Both packages follow the same boundary discipline as the existing `investigation/controller/` and `investigation/service/` packages — they talk directly to `InvestigationContextStore`, no new store needed.

### New endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/investigation/{caseId}/review-summary` | Read-only aggregation for Principal Officer: snapshot, node verdict breakdown, evidence count, timeline, recommendation, STR draft |
| `POST` | `/api/investigation/{caseId}/str-draft` | Calls `StrDraftService.generateDraft()` — AI-assisted STR narrative |
| `PUT` | `/api/investigation/{caseId}/str-draft` | Officer-edited narrative — sets `officerEdited: true` |
| `POST` | `/api/investigation/{caseId}/decision` | APPROVE → `RESTRICTION_ACTIVE`, RETURN/NEED_MORE_EVIDENCE → `RETURNED_TO_AML`, REJECT → `CLOSED_FALSE_POSITIVE` |
| `POST` | `/api/investigation/{caseId}/execution` | Appends `ExecutionRecord`; if `action == RESTRICTION_APPLIED`, transitions to `RESOLVED` |

### `StrDraftService` — the one new AI call

Uses the existing `AiClient` bean (same provider, same API key, same rate limiter counter via `AiOrchestrationService.dailyCalls`). Does **not** go through `AiOrchestrationService` because that service exists to produce structured `AiSchemaContract` JSON for node classifications — its validation logic (enum checking, nodeId matching) would actively break free-text narrative generation.

The system prompt instructs the model to use Indian banking terminology (STR, FIU-IND, PMLA, lien) and return plain prose under 300 words. If the AI call fails, a `RuntimeException` wrapping the checked `AiUnavailableException` propagates to the controller, which returns HTTP 503 — the frontend shows an inline error with a retry option and a manual textarea fallback.

### State machine — no new states added

`NEED_MORE_EVIDENCE` and `RETURN` both map to the existing `RETURNED_TO_AML` transition. The distinction is preserved as a `reasonCode` prefix on the appended `CaseNote` (`[RETURN]` vs `[NEED_MORE_EVIDENCE]`), so the AML officer's queue can show why the case came back without requiring a new state machine node.

---

## Frontend rewrites

### `ComplianceWorkspace.jsx` — Principal Officer

**What was removed:**
- All `useApp`/`AppContextSimplified` imports for case data (kept only for the case list display, which still reads from localStorage — see "hybrid data layer" note below)
- `isGeneratingSAR`, `sarGenerated`, `isGeneratingDPIP`, `dpipGenerated` state variables
- `generateSARPdf()` and `generateDPIPPdf()` functions
- The mock `handleAction()` that called `finalizeRestriction`/`returnToAML`/`rejectCase` on the mock context

**What was added:**
- `fetchReviewSummary(caseId)` — fetches `GET /api/investigation/{caseId}/review-summary` when a case is selected; populates `reviewCtx` with real backend data
- `useReviewChecklist(ctx)` — derives 4 checks client-side from `reviewCtx` (all nodes reviewed, evidence attached, recommendation present, timeline verified); no new backend field
- `handleGenerateStr()` — `POST /str-draft`, populates editable textarea
- `handleSaveStr()` — `PUT /str-draft`, saves officer edits
- `handleDecision(decision)` — `POST /decision` with APPROVE/RETURN/REJECT/NEED_MORE_EVIDENCE; RETURN/NEED_MORE_EVIDENCE require a comment before the button fires
- `handleExportEvidencePackage()` — generates a PDF using existing `jsPDF`/`autoTable` dependency; includes timeline from `reviewCtx` and STR narrative if present; SHA-256 integrity hash appended

**Hybrid data layer note:** The case list (left panel) still reads from `AppContextSimplified` because that context holds the SSE-ingested alert queue and localStorage persistence. The right panel (review details) fetches from the real backend. This is intentional — the case list is a UI concern (which cases exist, what their status is), while the review panel is an investigation concern (what the AML officer found). The two layers are consistent because `AppContextSimplified` transitions are triggered by the same backend state changes.

**No graph, no AI Copilot, no node editing** — `SuspectGraphCanvas`, `AiCopilotPanel`, `ReviewCommentBar`, `NodeDetailDrawer`, `NodeActionControl`, `ReviewStatusControl` are not imported. This is enforced by absence, not by a prop or conditional render.

### `BranchWorkspace.jsx` — Branch Manager

**What was removed:**
- All `useApp`/`AppContextSimplified` imports except `getCasesByStatus` for the case list
- `appendAuditLog` calls (replaced by real backend execution log)
- `escalationNote`/`escalationSubmitted` state (escalation is now a real backend action via the execution endpoint)
- Mock file upload (files were only stored as name strings in local state)

**What was added:**
- `logAction(action, note)` — `POST /execution` for interaction logging (CUSTOMER_CONTACTED, CUSTOMER_VISITED, DOCUMENTS_SUBMITTED); idempotent via `loggedActions` Set per case
- `handleFileUpload(files)` — calls the existing `POST /{caseId}/evidence` multipart endpoint (same `EvidenceController` the AML officer uses); no new upload handler written
- `handleExecute(action)` — `POST /execution` with RESTRICTION_APPLIED or UNABLE_TO_APPLY; RESTRICTION_APPLIED transitions the case to RESOLVED on the backend and clears the selected case from the UI

**No AI, no graph, no investigation** — Branch Manager screen shows only: restriction details, customer interaction buttons, document upload, execution status.

---

## Scope boundaries (what was explicitly not built)

- No `SuspectGraphCanvas` interaction for either role
- No `AiCopilotPanel` or `/reanalyze` access from either component tree
- No new `officerVerdict` or `nodeAction` values — only AML sets these
- No new investigation state machine states
- No separate PDF pipeline — `jsPDF`/`autoTable` already imported in the old `ComplianceWorkspace`, reused as-is
- No `GET /branch-queue` endpoint that enumerates the in-memory store — the Branch Manager's case list reads from `AppContextSimplified` (same as the Principal Officer list), which is the correct source of truth for case status at the UI layer

---

## Test regression status

Pre-existing test failures (4) are unrelated to this implementation:
- `ModuleBoundaryTest` — ArchUnit JDK version mismatch (class file major version 69 vs ArchUnit's ASM version); pre-existing
- `PreFlaggerEngineTest.compositeScoreTriggersP1` — pre-existing score threshold assertion failure
- `BackendApplicationTests.contextLoads` — Spring context load failure; pre-existing
- `CsvReplayIntegrationTest` — cascades from context load failure; pre-existing

No new test failures introduced. Backend compiles clean (`mvnw compile` exits 0). Frontend builds clean (`vite build` exits 0, 3375 modules transformed).
