Repository: Muskets (IOB)

Purpose
-------
This file is an AI-oriented summary (for Claude-style agents) of the repository. It is intended to be short, factual, and oriented toward programmatic consumption by other AI tools. Continue the file with additional notes or memory content.

High-level summary
------------------
- Name: Muskets — Post-Detection Containment and Operational Response Platform
- Stack: Frontend (React + Vite + Tailwind) deployed on Vercel, Backend (Spring Boot 4.1.0, JDK 25, Maven) deployed on Railway. H2 file-mode database for persistence.

Key files & start commands
--------------------------
- Root README: contains architecture, problem statement, solution, detection math, and deployment instructions.
- Frontend: `frontend/` — run `npm ci` then `npm run dev` (dev) or `npm run build` (production). Vite dev server on port 5173.
- Backend: `backend/` — run `./mvnw spring-boot:run` (dev) or `./mvnw clean package -DskipTests && java -jar target/*.jar` (production JAR).
- CI: GitHub Actions runs `./mvnw clean verify -DskipTests` on push/PR to main.

Quick notes for Claude-style agents
----------------------------------
- When editing files, prefer small, focused diffs and preserve existing project structure.
- Run `./mvnw clean package -DskipTests` in the `backend/` directory to verify compilation.
- The repository contains downloaded Windows Zone.Identifier ADS files; they are ignored via `.gitignore`.

Where to continue (memory)
--------------------------
- Store short-lived runtime facts (dev server ports, artifact locations) in ephemeral memory.
- Store long-lived facts (project purpose, major directories, build commands) in persistent memory for future agents.

End of initial CLAUDE.md — continue by appending further operational notes and memory pointers.

### Dev Commands Summary
- **Frontend (Vite + React)**:
  - Install: `cd frontend && npm install`
  - Run Dev: `cd frontend && npm run dev`
  - Build: `cd frontend && npm run build`
- **Backend (Spring Boot)**:
  - Run Dev: `cd backend && .\mvnw.cmd spring-boot:run`
  - Package: `cd backend && .\mvnw.cmd clean package -DskipTests`
  - Run tests: `cd backend && .\mvnw.cmd test -Dspring.profiles.active=test`

### Workbench Architecture & UI Features
- **3-Zone Layout**: Persistent left rail (Case Details, Timeline, Notes), center workcanvas (Suspect Graph, inline decision modals), and right drawer (Node Inspector tabs / Case Escalation).
- **Inline Gateway Modal**: Gate decision Modal (`CaseGateModal.jsx`) is rendered inline inside the center canvas rather than full-screen overlays to prevent hiding context.
- **Node-Verdict Gating**: Escalation to legal review is guarded. Both the backend `/proceed` endpoint and the frontend submission validation block legal escalation until all nodes in the suspect graph have been assigned a review verdict.
- **Queue Segmentation**: Sidebar queue is segmented into four tabs: `Triage` (Fresh alerts), `Drafts` (Active investigations), `Escalated` (Awaiting Legal), and `Archived` (Closed).

### AI Copilot Integration
- **JSON Schema Enforcement**: Leverages Gemini's native `generationConfig.responseSchema` to guarantee structured JSON outputs matching the `AiSchemaContract` contract, completely preventing unstructured text/markdown responses.
- **Asynchronous AI Triage Scan**: Suspect graph constructs instantly without waiting for the LLM. The initial triage scan runs in a background thread while the frontend UI displays a loading spinner and polls context state every 1.5s until complete.
- **On-Demand AI Refresh**: A dedicated `/refresh-ai` endpoint allows officers to rerun network evaluation on-demand.
- **Response Telemetry**: Performance metadata (live vs mocked status, provider, model, latency in ms, and timestamp) is displayed as a badge at the bottom of the AI Copilot tab.
- **Retry-Once Policy**: Captures JSON schema parsing and semantic validation failures on the backend and retries the call once with the validation errors appended to the prompt. HTTP/network errors (429, 503, 401) propagate immediately.
- **Shared Mock Evaluator**: Reuses the same mock response keyword evaluator across swappable client implementations for offline/hackathon execution.

### Principal Officer (Compliance) Workspace
- **Role label**: "Principal Officer (Compliance)" — not "Legal & Principal Officer". Files: `LoginPage.jsx`, `SideNav.jsx`, `MainLayout.jsx`.
- **Hybrid data layer**: Case list (left panel) reads from `AppContextSimplified` (SSE-ingested alert queue). Right panel fetches from real backend via `GET /api/investigation/{caseId}/review-summary`.
- **STR Draft**: `POST /str-draft` calls `StrDraftService` which uses `AiClient` directly (bypasses `AiOrchestrationService` JSON validation — STR needs free-text prose, not structured schema). `PUT /str-draft` saves officer edits with `officerEdited: true`.
- **Decision flow**: `POST /decision` maps APPROVE→RESTRICTION_ACTIVE, RETURN/NEED_MORE_EVIDENCE→RETURNED_TO_AML, REJECT→CLOSED_FALSE_POSITIVE. RETURN/NEED_MORE_EVIDENCE require a comment before the API call fires. Both map to the same state machine transition; differentiated by `[reasonCode]` prefix on the appended CaseNote.
- **Evidence Package export**: jsPDF/autoTable generates a PDF client-side with case snapshot, timeline, and STR narrative. No new backend endpoint.
- **Review checklist**: Derived entirely client-side from `reviewCtx` — no new backend field.

### Branch Manager Workspace
- **Case list**: Reads from `AppContextSimplified` filtered to `RESTRICTION_ACTIVE` only.
- **Interaction logging**: Three buttons (CUSTOMER_CONTACTED, CUSTOMER_VISITED, DOCUMENTS_SUBMITTED) each call `POST /execution`. Idempotent via per-case `Set` in local state.
- **Document upload**: Calls existing `POST /{caseId}/evidence` multipart endpoint (`EvidenceController`) — no new upload handler.
- **Execution**: `POST /execution` with RESTRICTION_APPLIED transitions case to RESOLVED on backend; frontend clears selection when `data.caseStatus === 'RESOLVED'`.

### Backend — New Packages and Endpoints (Principal/Branch)
- `investigation/principal/PrincipalReviewController.java` — 4 endpoints: GET /review-summary, POST /str-draft, PUT /str-draft, POST /decision
- `investigation/principal/StrDraftService.java` — AI-assisted STR narrative; uses `AiClient` bean directly
- `investigation/branch/BranchExecutionController.java` — POST /execution; guards non-RESTRICTION_ACTIVE cases; RESTRICTION_APPLIED triggers RESOLVED
- New DTOs: `StrDraft` (narrative, generatedAt, officerEdited, status), `ExecutionRecord` (recordId, action, note, recordedBy, timestamp)
- New request DTOs: `PrincipalDecisionRequest(decision, comment)`, `ExecutionUpdateRequest(action, note)`
- `InvestigationContext` additions: `StrDraft strDraft`, `List<ExecutionRecord> executionLog`

### Terminology (Indian banking — enforced throughout)
- STR (Suspicious Transaction Report) to FIU-IND under PMLA — not SAR to FinCEN
- Case Evidence Package — not DPIP (DPIP is a real RBI/I4C system; reusing the acronym was a naming collision)
- Principal Officer (Compliance) — not Legal & Principal Officer

### State Machine (InvestigationStatusMachine.java) — current valid transitions
- PENDING_TRIAGE → UNDER_INVESTIGATION, CLOSED_FALSE_POSITIVE
- UNDER_INVESTIGATION → AWAITING_LEGAL_REVIEW, CLOSED_FALSE_POSITIVE
- AWAITING_LEGAL_REVIEW → RESTRICTION_ACTIVE, RETURNED_TO_AML, CLOSED_FALSE_POSITIVE
- RETURNED_TO_AML → AWAITING_LEGAL_REVIEW, CLOSED_FALSE_POSITIVE
- RESTRICTION_ACTIVE → RESOLVED
- CLOSED_FALSE_POSITIVE → (terminal)
- RESOLVED → (terminal)

### Known pre-existing test failures (do not investigate)
- `ModuleBoundaryTest` — ArchUnit JDK version mismatch (class file major version 69)
- `PreFlaggerEngineTest.compositeScoreTriggersP1` — score threshold assertion
- `BackendApplicationTests.contextLoads` — Spring context load failure
- `CsvReplayIntegrationTest` — cascades from context load failure

### Code review findings resolved (commit 7c3a8dd)
- `PrincipalReviewController`: `toLowerCase(Locale.ROOT)` — locale-neutral string folding
- `PrincipalReviewController`: switch expression refactor — eliminates fall-through scanner warning
- `StrDraftService`: `InterruptedException` handler added before broad `Exception` catch; broad catch is interface-forced by `AiClient.call() throws Exception`
- False positives confirmed: SSRF on `VITE_BACKEND_URL` (build-time env var), CWE-396 on `StrDraftService` (interface-forced)
