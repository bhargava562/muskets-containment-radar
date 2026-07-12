# AML Officer Investigation Workbench

## The Compliance & Audit Philosophy
In financial intelligence, the primary responsibility of an Anti-Money Laundering (AML) Officer is not to perform a blind search for every possible bad actor, but rather to answer a specific legal question:
> **"Do I have sufficient, verified evidence to recommend the containment (e.g., freezing or putting a lien hold) of this case to the Principal Officer?"**

In MUSKETS, the AI is not the decision-maker. It functions strictly as an expert assistant. The investigator's role is to **audit the AI's findings node-by-node**, collect supporting evidence, record personal verdicts, and sign off on a case-level recommendation.

---

## Unified Investigation Workflow

The investigation of a transaction containment radar alert progresses through a structured lifecycle:

1. **Alert Ingest & Triage**: A rule triggers on the core banking system (e.g. rapid fund velocity or KYC mismatch) and populates the **Triage Queue**.
2. **Gateway Modal (Case Snapshot)**: The officer clicks an alert to inspect case-level facts (Account ID, holder name, risk amount, priority, trigger reasons).
3. **Graph Generation**: The officer clicks "Build Suspect Graph" to deploy the Post-Operator Engine, which computes transactions up to `MAX_HOPS = 4`. The case status changes to `UNDER_INVESTIGATION` (Draft).
4. **Structured Node Review**: 
   - The investigator clicks individual nodes in the suspect graph.
   - For each node, the investigator reviews the **Overview**, **KYC profile**, **CBS transaction history**, **AI evaluation**, and **evidence attachments**.
   - The investigator records an independent **Officer Verdict** (`CONFIRMED`, `DISPUTED`, `CLEARED`, or `NEEDS_MORE_EVIDENCE`) and **Node Action** (e.g. Lien Hold).
5. **Final Recommendation**:
   - The investigator selects the **Case Escalation** tab in the sidebar drawer.
   - A checklist tracks reviewed nodes and evidence files.
   - The investigator enters the overall rationale and Locks the Case Recommendation.
6. **Escalation**:
   - The investigator reviews the auto-generated Legal Escalation Dossier and clicks "Sign & Escalate to Legal". The case transitions to `AWAITING_LEGAL_REVIEW`.

---

## Workbench UI Layout

The workspace is organized into a **3-zone persistent layout** to prevent cognitive overload and ensure the investigator remains in context:

```
+-------------------------------------------------------------------------------+
| Header Banner (Title, Refresh Telemetry Button, Back Button)                 |
+----------------------+--------------------------------+-----------------------+
|                      |                                |                       |
|  LEFT RAIL           |  CENTER WORKCANVAS             |  RIGHT DRAWER         |
|  (Case Overview &    |                                |                       |
|   Notes)             |  (Suspect Graph Canvas         |  [Node Inspector] /   |
|                      |   OR                           |  [Case Escalation]    |
|  - Detection Details |   Inline Gate Modal)           |                       |
|  - Risk Score        |                                |  - Profile Tabs       |
|  - Timeline Events   |                                |  - Verdict Controls   |
|  - Notes Repository  |                                |  - Progress Checklist |
|                      |                                |  - Recommendation Form|
|                      |                                |                       |
+----------------------+--------------------------------+-----------------------+
|  Bottom AI Copilot Comment Bar (Focus Node Query)                            |
+-------------------------------------------------------------------------------+
```

### Key UI Features

* **Inline Gate Modal**: Instead of full-screen overlays that block the workspace, the initial **Case Gate Modal** renders inline in the center canvas when a case starts. This keeps the left Overview Rail visible immediately.
* **Dual-Mode Right Sidebar**: The right sidebar toggles between:
  1. **Node Inspector**: Node-specific CBS summaries, KYC attributes, evidence logs, and AI evaluation metrics.
  2. **Case Escalation**: Overall progress checklist, case recommendation form, and the dossier generator button.
* **Gated Escalation**: The "Proceed" button is locked on both the frontend and backend. The case cannot transition to `AWAITING_LEGAL_REVIEW` until all nodes in the graph have been audited and assigned a verdict.

---

## Compliance Logic & Data Integrity
To preserve evidence chain and data privacy, the workbench enforces strict boundaries:
* **PII Masking**: Suspect graph payloads undergo server-side hashing and masking before being sent to the AI evaluation engine.
* **Exclusion of Annotations**: Human notes are kept strictly inside the database and never sent to the LLM context. This guarantees that internal compliance thoughts and legal strategy do not leak to public APIs or run the risk of LLM pollution.
