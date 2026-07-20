Agents & Memory Handoff
=======================

Purpose
-------
This file documents how AI agents (search agents, CI agents, documentation agents, etc.) should interact with the repository and with each other. It provides clear starting tasks, conventions for storing contextual memory, and where to append results so future agents can continue work.

Repository overview (short)
---------------------------
- Project: Muskets (IOB) — Post-Detection Containment & Operational Response
- Important paths:
  - `frontend/` — React + Vite app
  - `backend/` — mock Express server and a Maven Spring Boot project
  - `.github/workflows/ci.yml` — CI workflow (builds frontend & backend)
  - `.github/workflows/ci.yml` — CI workflow (builds backend with Maven)

Agent responsibilities
----------------------
- Search Agent: locate relevant files, summarize code, extract build/test commands, and report locations. (This agent was used to seed the initial context.)
- CI Agent: validate and iterate on `.github/workflows/ci.yml`, ensure pipeline builds on Ubuntu, verify java/node versions, run test jobs and report failures.
- Docs Agent: improve README sections, generate developer onboarding docs, and expand `CLAUDE.md` with memory pointers.
- Security Agent: scan dependencies (npm, maven) for known CVEs and produce remediation suggestions.

Memory & Handoff conventions
---------------------------
- Each agent should append its findings to either `CLAUDE.md` or `AGENTS.md` (under a new dated heading) so subsequent agents can pick up the thread. Keep entries short (2–6 sentences) and factual.
- For ephemeral run outputs (CI logs, local test run outputs), agents should upload artifacts to the CI job or attach them to the originating PR; do not commit raw logs into the repository.
- For persistent knowledge (design decisions, long-lived build fixes, package pins), commit small documentation updates and reference the commit hash in the agent's memory entry.

How to extend
-------------
1. Create or update a single small file per change and run the repository tests or CI locally (via Maven or GitHub Actions runner) to confirm.
2. Append a one-paragraph summary to `AGENTS.md` under a new section titled with the agent name and ISO date (e.g., `## SearchAgent — 2026-07-02`).
3. If the change affects build/runtime behavior, include a `How to test` snippet and the exact commands used.

Privacy / Security note
-----------------------
Do not store secrets or credentials in `CLAUDE.md` or `AGENTS.md`. Use CI secrets or environment variables in GitHub Actions.

End of AGENTS.md — other agents should now append operational findings using the conventions above.

## DetectionAgent — 2026-07-12
Implemented the Spring Boot Detection Module (O(1) PreFlagger and bounded BFS PostOperator) using JDK 25 and Spring Boot 4.1.0. Configured Flyway migrations for schema management, ArchUnit tests to enforce strict module boundaries, and updated the GitHub Actions CI pipeline. Excluded the secret `sample_mule_account_data.csv` from Git.

### How to test
```bash
# Run Maven tests natively
cd backend && ./mvnw test -Dspring.profiles.active=test
```

## InvestigationWorkspaceAgent — 2026-07-12
Implemented the state-machine gated AML Officer Investigation Workspace using React/Vite and Spring Boot. Standardized a 3-zone persistent layout with a collateral left rail (CaseOverviewRail and CaseNotesPanel), center canvas (SuspectGraphCanvas with completion indicators and pre-computed secondary counterparty hop preview loops), and dynamic right drawer (NodeDetailDrawer containing CBS/KYC cards, evidence logs, and AI Copilot revisions). Enforced strict output schema validation and PII masking inside the Java reanalysis engine. Case notes are human-to-human annotations strictly excluded from the AI prompt context.

### How to test
```bash
# Verify client compilation and build bundle
cd frontend && npm run build
```

## WorkbenchAuditAgent — 2026-07-12
Refactored the AML Officer Investigation Workspace layout to remove intrusive floating overlays, rendering the initial CaseGateModal inline in the center canvas and shifting the RecommendationPanel to a dual-mode sidebar (Node Inspector / Case Escalation). Implemented sidebar segmentations (Triage Queue / Drafts / Escalated / Archived) to partition alerts dynamically. Enforced a progress-gated validation check on the `/proceed` endpoint (backend and frontend) that blocks legal escalation until every node in the graph has been reviewed and assigned a verdict.

### How to test
```bash
# Compile and build the React/Vite application
cd frontend && npm run build

# Run Spring Boot backend packaging
cd backend && .\mvnw.cmd clean package -DskipTests
```

## InvestigationFlowAgent — 2026-07-13
Fixed the core investigation workflow bug: NodeDetailDrawer default tab was `overview` (containing verdict/containment controls), meaning an officer could set a verdict before reviewing AI reasoning. Reordered tabs to `[AI Assessment, Transactions, Evidence, KYC, CBS, Decision]` with `ai` as default. Implemented blocking DISPUTED verdict pattern (textarea required before verdict fires). Split EvidenceRepository into SYSTEM-GENERATED and OFFICER-UPLOADED sections. Added investigation audit log panel surfacing the timeline[] array. Enriched backend DTOs: KycData (+mobile/occupation/customerSince), CbsData (+nominee/lienAmount/lastDebitDate/lastCreditDate), DeviceData (+simChanged/failedLoginAttempts/geoVelocityFlag), new ComplaintData record, and EvidenceClaim (+evidenceId/linkedRecordId for clickable evidence provenance). Upgraded seed data with all new fields including complaint linkage on victim node. Updated InvestigationContext.jsx to include officerNote in both optimistic state update and fetch body. Replaced hardcoded escalation checklist with dynamically computed items gated on real state.

### How to test
```bash
# Backend
cd backend && .\mvnw.cmd clean package -DskipTests

# Frontend
cd frontend && npm run build
```

## GeminiApiIntegrationAgent — 2026-07-14
Implemented Gemini native JSON structured output integration on the Spring Boot backend using responseSchema enforcement, custom error exception mapping (503 and 429), and a retry-once validation wrapper. Designed the initial triage assessment to run asynchronously in a background thread to prevent blocking graph construction. Configured the React frontend with a 1.5-second polling loop and populated a telemetry metadata badge in the AI panel.

### How to test
```bash
# Verify backend package compilation
cd backend && .\mvnw.cmd clean package -DskipTests

# Verify React application bundles correctly
cd frontend && npm run build
```

## PrincipalOfficerBranchManagerAgent — 2026-07-14
Rewired `ComplianceWorkspace.jsx` (Principal Officer) and `BranchWorkspace.jsx` (Branch Manager) from mock `AppContextSimplified` context to real Spring Boot backend endpoints. Created two new backend packages: `investigation/principal/` (PrincipalReviewController, StrDraftService) and `investigation/branch/` (BranchExecutionController). Added 5 new REST endpoints under `/api/investigation/{caseId}/`: `GET /review-summary`, `POST /str-draft`, `PUT /str-draft`, `POST /decision`, `POST /execution`. Added `StrDraft` and `ExecutionRecord` DTOs plus `strDraft` and `executionLog` fields to `InvestigationContext`. Applied terminology corrections across LoginPage, SideNav, MainLayout: SAR→STR (FIU-IND/PMLA), DPIP→Case Evidence Package, "Legal & Principal Officer"→"Principal Officer (Compliance)". Decision flow maps APPROVE→RESTRICTION_ACTIVE, RETURN/NEED_MORE_EVIDENCE→RETURNED_TO_AML, REJECT→CLOSED_FALSE_POSITIVE via the existing state machine. No new state machine states added. Backend compiles clean, frontend builds clean (3375 modules). 4 pre-existing test failures confirmed unrelated.

### How to test
```bash
cd backend && .\mvnw.cmd compile
cd frontend && npm run build
```

## CodeReviewFixAgent — 2026-07-14
Ran full code review across all 6 files from the Principal Officer/Branch Manager implementation. Fixed 2 real findings in `PrincipalReviewController.java`: added `Locale.ROOT` to `toLowerCase()` call (locale-sensitivity fix) and converted statement-form switch to switch expression (eliminates fall-through warning). Fixed 1 finding in `StrDraftService.java`: added explicit `InterruptedException` handler before the broad `Exception` catch; broad catch retained because `AiClient.call()` declares `throws Exception` at the interface level — narrowing is not possible without changing the interface. Two findings confirmed false positives: SSRF on `VITE_BACKEND_URL` (build-time env var, not runtime input) and CWE-396 on `StrDraftService` (interface-forced). Backend compiles clean after fixes. See `docs/07-CODE-REVIEW-FIXES-AND-VERIFICATION.md` for full detail.

### How to test
```bash
cd backend && .\mvnw.cmd compile
```

## SecurityAndDocsAgent — 2026-07-14
Audited the codebase for credentials safety and verified that no sensitive API keys or credentials are hardcoded. Excluded the `GEMINI_API_KEY` configuration from version control, binding it dynamically in `application.yaml` to resolve from environment variables. Verified that `.env` files, local database files under `data/`, and the dataset `sample_mule_account_data.csv` are properly ignored by Git using `.gitignore`. Created `docs/08-SECURITY-AND-CREDENTIALS-SAFETY.md` documenting this security layout, and registered it in the documentation index.

### How to test
```bash
# Verify that untracked/ignored credentials remain uncommitted
git status --ignored
```

## GroqAiProviderAgent — 2026-07-14
Implemented Groq native API provider integration on the Spring Boot backend via a swappable `GroqAiClientImpl` component conditional on `app.ai.provider=groq`. Integrated Groq OpenAI-compatible request structure enforcing `response_format: { type: "json_object" }` at request time. Reused the shared `MockAiEvaluator` for offline fallback when the API key is absent. Changed default provider to `groq` with `llama-3.1-8b-instant` as the default model. Updated security and credential documentation.

### How to test
```bash
# Verify backend package compilation
cd backend && .\mvnw.cmd compile
```

## RailwayDeploymentAgent — 2026-07-20
Removed Docker completely from the codebase by deleting Dockerfile, docker-compose.yml, .dockerignore, and backend/compose.yaml. Updated GitHub Actions to run a native Java 25 verification build using Maven wrapper instead of Docker. Added PORT env var mapping to application.yaml, configured backend/railpack.json to pin Java version 25 for Railway deployment compatibility, and thoroughly updated all documentation indices and instructions. Fully rewrote the root README.md with comprehensive descriptions, detection math formulas, role-based workflows, screenshots, and system architecture. Tracked and committed `sample_mule_account_data.csv` to version control and verified CSV ingestion works on the live Railway public URL.

### How to test
```bash
# Verify the build locally without Docker
cd backend && ./mvnw clean package -DskipTests

# Verify live Railway endpoint CSV processing
curl -X POST https://muskets-containment-radar-production.up.railway.app/api/detection/replay-csv
```

## AnalyticsAgent — 2026-07-20
Imported and integrated the Vercel Analytics component into the main layout of the React application (`App.jsx`). Configured the correct `@vercel/analytics/react` entrypoint path suitable for standard React Vite applications rather than Next.js. Verified successful bundling and compilation.

### How to test
```bash
cd frontend && npm run build
```

