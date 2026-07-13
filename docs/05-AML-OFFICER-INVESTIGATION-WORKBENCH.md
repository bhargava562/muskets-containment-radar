# 05 — AML Officer Investigation Workbench

## Purpose

The Investigation Workbench is the AML Officer's primary working interface in MUSKETS. It provides a structured, gated workflow that enforces a specific investigation sequence: **AI investigates first, the AML Officer validates, and only then records a verdict and containment action.**

## Core Invariant

> **An officer must see the AI's claim and its evidence before the UI lets them set a verdict or a containment action.**

This is enforced by tab ordering, not by access control. The `Decision` tab (where verdict and containment controls live) is the **last** tab in the inspector — it comes after AI Assessment, Transactions, Evidence, KYC, and CBS. The default landing tab when a node is selected is `AI Assessment`.

## Investigation Flow

The officer's mental model follows six steps:

1. **Open the case** — read the AI-generated investigation summary and suspect graph.
2. **Select each node** — review the AI's reasoning first (AI Assessment tab).
3. **Validate the AI** — check the transaction ledger, evidence, KYC, CBS, and complaint data. If evidence is missing, upload new documents or request branch verification, then reanalyze.
4. **Record an officer verdict** — `Confirmed`, `Disputed`, `Needs More Evidence`, or `Cleared`.
5. **Choose a containment action** — `Monitor`, `Partial Lien`, `Full Freeze`, etc.
6. **Formulate the case recommendation** — escalate to the Principal Officer.

## Layout Architecture

### 3-Zone Persistent Layout

| Zone | Component | Contains |
|------|-----------|----------|
| **Left Rail** | `CaseOverviewRail.jsx` | Case metadata, alert details, investigation timeline, case notes |
| **Center Canvas** | `SuspectGraphCanvas.jsx` + `CaseGateModal.jsx` | Interactive suspect graph with verdict-colored rings, inline gateway modal |
| **Right Drawer** | `NodeDetailDrawer.jsx` | Node Inspector tabs, Case Escalation checklist, Investigation Audit Log |

### Right Drawer — Three Main Tabs

1. **Node Inspector** — AI-first tab ordering for individual node review
2. **Case Escalation** — Dynamic checklist gating + RecommendationPanel
3. **Audit Log** — Automatic investigation event timeline

## Node Inspector Tab Order

| Position | Tab | Purpose |
|----------|-----|---------|
| 1 | **AI Assessment** | AI classification, confidence, reasoning chain, evidence claims |
| 2 | **Transactions** | Chronological transaction ledger for this node |
| 3 | **Evidence** | System-generated evidence + officer-uploaded documents |
| 4 | **KYC** | Customer profile, identity verification, linked complaints |
| 5 | **CBS** | Core banking summary, balances, lien status, nominee |
| 6 | **Decision** | Officer verdict + containment action (last position by design) |

## Per-Node Investigation Status

Each node displays an investigation status computed from its current state:

| Status | Condition |
|--------|-----------|
| `AI Generated — Awaiting Review` | No verdict set, no evidence attached |
| `Evidence Attached` | Officer has uploaded evidence for this node |
| `Verdict Recorded` | Officer has set a verdict |
| `Verdict + Action Recorded` | Both verdict and containment action are set |

This status appears in the Node Inspector header and is distinct from the officer's final verdict.

## Blocking DISPUTED Verdict Pattern

When an officer clicks `Dispute Anomaly`:

1. The verdict does **not** fire immediately.
2. A textarea appears requiring the officer to document why they disagree with the AI.
3. The "Confirm Dispute" button fires a single combined PATCH containing both `officerVerdict: DISPUTED` and `officerNote: "..."`.
4. A DISPUTED verdict cannot exist without a note — this is enforced by the UI blocking pattern, not by backend validation.

All other verdicts (`CONFIRMED`, `CLEARED`, `NEEDS_MORE_EVIDENCE`) fire immediately with `officerNote: null`.

## Evidence Repository — Provenance Split

Evidence is split into two sections:

### System-Generated
Derived client-side from existing node data — no new backend fetch:
- **KYC Record** — verification status and ID type
- **Core Banking Summary** — account type and opening date
- **Device Telemetry** — VPN/SIM change/geo-velocity anomaly flags
- **Linked Complaint** — if a complaint is filed against/involving this account
- **AI Evidence Claims** — each claim with an `evidenceId` (e.g., `EV-12`) and weight badge

### Officer-Uploaded
Files manually uploaded by the officer during investigation:
- PDF, CSV, PNG, LOG documents
- Branch verification letters
- Customer statements

## Escalation Checklist Gating

The Case Escalation tab contains a dynamic checklist computed from real investigation state:

| Checklist Item | Computed From |
|----------------|---------------|
| Every node reviewed | `reviewedNodes === totalNodes && totalNodes > 0` |
| Evidence attached where flagged | `totalEvidence > 0` |
| AI reasoning reviewed on every node | Same as node review (tab default is AI, naturally gated) |
| No DISPUTED node without a note | `!nodes.some(n => n.officerVerdict === 'DISPUTED' && !n.officerNote)` |

The **Proceed** button and `RecommendationPanel` are gated on **all four items passing**, not just node-review count.

## Investigation Audit Log

An automatic event timeline records every system action and officer decision:

- Alert triggers
- AI evaluations and reanalysis events
- Officer verdicts (with dispute notes)
- Evidence uploads
- Containment actions
- Case recommendation submissions

This log is sourced from the `timeline[]` array on the investigation context, which is appended to by backend services automatically. It is distinct from **Case Notes**, which are human-authored annotations.

## Data Model — Enriched DTOs

### KycData
`customerName`, `idType`, `idNumber`, `dateOfBirth`, `address`, `kycStatus`, `lastVerifiedDate`, `riskCategory`, `mobile`, `occupation`, `customerSince`

### CbsData
`accountNumber`, `ifscCode`, `accountType`, `branchName`, `currentBalance`, `averageMonthlyBalance`, `accountOpenDate`, `totalTransactionsLast30Days`, `totalDebitLast30Days`, `totalCreditLast30Days`, `accountStatus`, `nominee`, `lienAmount`, `lastDebitDate`, `lastCreditDate`

### DeviceData
`lastLoginDevice`, `lastLoginIp`, `lastLoginLocation`, `lastLoginTimestamp`, `uniqueDevicesLast30Days`, `uniqueIpsLast30Days`, `vpnDetected`, `rootedDeviceDetected`, `simChanged`, `failedLoginAttempts`, `geoVelocityFlag`

### ComplaintData (New)
`complaintId`, `victimName`, `crimeType`, `reportedAmount`, `registeredAt`, `firLinked`

### EvidenceClaim (Enriched)
`evidenceId`, `source`, `derivedFrom`, `weight`, `linkedRecordId`

### InvestigationNode (Updated)
Added `complaint` (ComplaintData) and `officerNote` (String, mandatory for DISPUTED verdict).
