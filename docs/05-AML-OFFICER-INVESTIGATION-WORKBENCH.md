# 05 — AML Officer Investigation Workbench

## Purpose

The Investigation Workbench is the AML Officer's primary working interface in MUSKETS. It provides a structured, gated workflow that enforces a specific investigation sequence: **AI investigates first, the AML Officer validates, and only then records a verdict and containment action.**

## Core Invariant

> **An officer must see the AI's claim and its evidence before the UI lets them set a verdict or a containment action.**

This is enforced by tab ordering. The `Decision` tab (where verdict and containment controls live) is the **last** tab in the inspector — it comes after AI Assessment, Transactions, Evidence, KYC, and CBS. The default landing tab when a node is selected is `AI Assessment`.

---

## Redesigned Information Architecture (VS Code Explorer Model)

To better align with a real AML investigator's cognitive workflow, the UI has been re-architected to prevent information overload, increase whitespace, and remove duplicated details.

### 1. Closed Node Inspector initially
After clicking **Build Suspect Graph**, the Node Inspector remains closed, allowing the investigator to study the suspect graph canvas at full width.
- A floating indicator states: `Select a node to inspect` in the top right.
- Clicking any node triggers a clean slide-in animation, revealing the right drawer.

### 2. Removed Duplicate Data
- **Left Panel (Case Rail)**: Strictly limited to case-level fields: Case ID, priority, risk amount, traced target amount, workflow phase status, and case triage progress.
- **Right Panel (Node Inspector)**: Dedicated solely to the selected node's details. Account profile details (holder name, account balance) are completely removed from the left panel to avoid duplication.

### 3. Compact Node Summary
The Node Inspector header displays a unified summary:
- **Account Holder Name** & **Account ID**
- **Node Role Badge** (VICTIM, MULE, MERCHANT)
- **Triage Status** (UNREVIEWED, CONFIRMED, DISPUTED, CLEARED, NEEDS_MORE_EVIDENCE)
- **AI Confidence Score**

### 4. Top Progress bar (Cheklists status badges)
The completion tracker replaces the generic "1 of 4 verified" text with a row of checkable tags indicating the status of every node (e.g. `V1 | Verified`, `M1 | Pending`).

---

## Node Inspector Tab Order

| Position | Tab | Purpose |
|----------|-----|---------|
| 1 | **AI Assessment** | Classification, Risk score, Match confidence, Model reasoning, Recommended action, and Graph relationship |
| 2 | **Transactions** | Chronological transaction ledger for this node |
| 3 | **Evidence** | Complete evidence workspace |
| 4 | **KYC** | Profile identity, mobile, occupation, customerSince, linked complaints |
| 5 | **CBS** | Account type, balance, nominee, lien status, last txn dates |
| 6 | **Decision** | Officer verdict + containment action (isolated from AI text) |

---

## Advanced Evidence Workspace

The Evidence tab is structured as a dedicated investigation files database:
1. **AI Evidence Provenance**: Displays weight-scored AI claims linked to specific transaction or KYC IDs.
2. **System-Generated Records**: Links to KYC verification status, CBS nominee information, device telemetry (VPN/SIM SWAPPED), and 1930 Cyber Fraud complaints.
3. **Officer-Uploaded Records**: Custom document upload drag-and-drop zone.
4. **Collected Evidence Timeline**: Chronological trail logging when each piece of evidence was appended.

---

## Global Audit Logs SIEM Screen

Audit Logs are case-wide events rather than node-specific.
- **Removed** the Audit Log tab from the right panel.
- **Added** a global navigation icon (`Audit Logs`) to the main sidebar.
- Displays a SIEM-style database table aggregating all case activities, system triggers, AI reanalysis, and officer sign-offs across all investigations, sorted chronologically with full search and actor filter controls.

---

## Gated Decision & Blocking DISPUTED Verdict

When an officer disagrees with the AI classification:
1. Selecting **Dispute Anomaly** opens a mandatory note field.
2. The submission button remains disabled until the justification note is entered.
3. Escalating a case is blocked until every node is reviewed and no node is marked DISPUTED without a note.
