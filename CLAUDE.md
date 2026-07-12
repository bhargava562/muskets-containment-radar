Repository: Muskets (IOB)

Purpose
-------
This file is an AI-oriented summary (for Claude-style agents) of the repository. It is intended to be short, factual, and oriented toward programmatic consumption by other AI tools. Continue the file with additional notes or memory content.

High-level summary
------------------
- Name: Muskets — Post-Detection Containment and Operational Response Platform
- Stack: Frontend (React + Vite + Tailwind), Backend (Express mock server in Node.js) and an optional Spring Boot backend present under `backend/` (Maven project). Docker Compose is provided to run the stack locally.

Key files & start commands
--------------------------
- Root README: contains architecture, demo, and docker-first instructions.
- Frontend: `frontend/` — run `npm ci` then `npm run dev` (dev) or `npm run build` (production). Vite dev server on port 5173 in README.
- Backend: `backend/` — README mentions npm-based mock backend (start with `npm install` and `npm start`), and there is also a Maven Spring Boot project in the same folder (use `./mvnw spring-boot:run` or `./mvnw -B package`).
- Docker Compose: `docker compose up --build` will start frontend and backend (ports 5173 and 3001 by default).

Quick notes for Claude-style agents
----------------------------------
- When editing files, prefer small, focused diffs and preserve existing project structure.
- Use the Docker Compose flow for integration testing when possible; it matches README instructions.
- The repository contains downloaded Windows Zone.Identifier ADS files; they are ignored now via `.gitignore` and `.dockerignore` updates.

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
