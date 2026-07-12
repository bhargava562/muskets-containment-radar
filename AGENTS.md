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
  - `docker-compose.yml` — local docker-first dev flow

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
1. Create or update a single small file per change and run the repository tests or CI locally (via Docker Compose or GitHub Actions runner) to confirm.
2. Append a one-paragraph summary to `AGENTS.md` under a new section titled with the agent name and ISO date (e.g., `## SearchAgent — 2026-07-02`).
3. If the change affects build/runtime behavior, include a `How to test` snippet and the exact commands used.

Privacy / Security note
-----------------------
Do not store secrets or credentials in `CLAUDE.md` or `AGENTS.md`. Use CI secrets or environment variables in GitHub Actions.

End of AGENTS.md — other agents should now append operational findings using the conventions above.

## DetectionAgent — 2026-07-12
Implemented the Spring Boot Detection Module (O(1) PreFlagger and bounded BFS PostOperator) using JDK 25 and Spring Boot 4.1.0. Bundled the entire application (embedded React frontend + H2 file-mode DB) into a single Docker image via a multi-stage `Dockerfile` and `docker-compose.yml`. Configured Flyway migrations for schema management, ArchUnit tests to enforce strict module boundaries, and updated the GitHub Actions CI pipeline to build and test inside the container environment. Excluded the secret `sample_mule_account_data.csv` from Git and Docker build contexts.

### How to test
```bash
# Run Maven tests inside the docker compose container environment
docker compose run --rm --entrypoint "./mvnw test -Dspring.profiles.active=test" muskets
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
