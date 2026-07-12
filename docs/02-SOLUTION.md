# Solution

**Product name:** Muskets (also referred to as PFCE — Precision Fund Containment Engine)

> Status: Product concept and UI workflow are prototyped. The claims in this document describe the *intended* system. Cross-check against `04-PROTOTYPE-STATUS.md` for what's actually implemented versus what's still a design target.

---

## The one-sentence solution

**Muskets is an investigation workspace for post-detection fraud operations — it takes a MuleHunter-style alert and gives the investigator a single, pre-assembled case (account graph, evidence, recommended proportional action) instead of scattered systems, so a proportional lien can be decided and executed in minutes instead of hours.**

It is deliberately **not**:
- another fraud detection engine (it doesn't compete with or replace MuleHunter)
- another AML case-management platform in the generic sense
- a legal-automation tool or an STR-filing IDE
- a dashboard/"command center" in the vague, unscoped sense

It is a **workspace** — the same relationship VS Code has to compilers, Git, and terminals. VS Code didn't invent any of those tools; it organized access to them so a developer never has to context-switch between six disconnected systems mid-task. Muskets applies the same idea to fraud investigation: the bank already has EFRMS, CKYC, transaction history, device intelligence, and MuleHunter's alert — Muskets connects them into one place instead of building a seventh silo.

---

## The core design principle: "Antigravity"

**The AI should pre-prepare everything so the investigator never starts from an empty screen.**

This principle is the litmus test for every UI decision in the product:
- Showing raw account-holder PII with no context → **fails** the principle (empty-screen problem, just relocated).
- Showing a pre-built action plan, a crime-pattern classification, and a ranked list of recommended next steps → **passes** the principle.

When a component in the codebase violates this (e.g., a metrics panel that dumps raw fields instead of synthesized reasoning), that's flagged as a product bug, not just a styling issue.

---

## Why a graph, specifically

Mule fraud is a network crime, not a list of isolated transactions. A table of transactions cannot reveal:
- which account is the collection hub
- which account is the distribution/fan-out point
- shared devices, shared IPs, or circular fund movement across accounts

MuleHunter itself is understood to operate on graph-structured reasoning internally. Muskets surfaces that same relational view to the human investigator instead of forcing them to reconstruct it by hand from six separate transaction logs. This is why `react-force-graph-2d` is a load-bearing UI choice, not decoration.

---

## Why the workflow is flexible, not a fixed wizard

Real investigations don't follow a fixed linear script — a shared-device discovery might make the graph branch differently mid-investigation than a shared-IP discovery would. The product's UI should let the investigator jump to whatever the case needs next (request KYC, escalate, expand the graph, draft an action) rather than force a rigid Step 1 → 2 → 3 sequence. Evidence and recommended actions should surface *as they become relevant*, not on a predetermined schedule.

---

## AI's actual role: assistant, not decision-maker

At every containment decision point, the AI presents options — it does not act autonomously:

```
Possible next actions
✓ Request KYC verification
✓ Escalate to Compliance
✓ Recommend Partial Lien
✓ Draft STR
✓ Wait for additional information
```

The human always chooses. This matters for two reasons: (1) it matches how RBI's own regulatory framework expects human sign-off at each governance stage, and (2) it directly defuses the "black-box AI freezing my account" liability risk that the case law in `01-PROBLEM-STATEMENT.md` shows courts are actively punishing banks for.

---

## The three roles

The system is explicitly scoped to three roles that mirror real PMLA/RBI governance responsibilities — not generic "admin/user" roles:

| Role | RBI/PMLA-aligned title | Responsibility |
|---|---|---|
| **1. AML / Fraud Investigation Officer** | Primary investigator | Reviews MuleHunter-style alerts, explores the connected-account graph, builds the case, recommends a containment action (full freeze vs. proportional lien) |
| **2. Principal Officer / Compliance Officer** | Legal authorization layer | Reviews the assembled investigation package, checks proportionality against current case law, approves or returns the case, coordinates with FIU-IND/law enforcement as needed |
| **3. Branch Manager** | Customer-facing operational layer | Confirms customer/account context, handles customer communication about a restriction, executes approved actions, escalates disputes back to compliance |

> Note: earlier drafts used "Legal & Principal Officer" and "AML Compliance Officer" as role labels. These don't map cleanly to standard Indian bank org structure — `AML Investigation Officer`, `Branch Manager`, and `Principal Officer (Compliance)` are the more defensible terms to standardize on going forward. The current prototype still uses the older labels in places (see `04-PROTOTYPE-STATUS.md`).

---

## What the workspace actually assembles per case

Instead of an alert that just says `Risk Score: 91%`, the target case view bundles:

- Customer identity and account details
- Full traced transaction chain
- Connected-account graph (mules, merchants, victims)
- Prior alerts/history on any node in the graph
- AI-generated evidence summary and reasoning (XAI-style, in plain language)
- A **side-by-side comparison** of Full Freeze vs. Proportional Lien, including quantified collateral-damage impact (e.g., "only 4.3% of this merchant's balance is affected")
- Investigator notes field
- Case timeline / audit trail
- Export paths: interbank freeze packet, SAR (Suspicious Activity Report), DPIP-ready packet

---

## Business framing (why a bank would actually deploy this)

- **Not a competitor purchase risk to MuleHunter vendors** — Muskets is explicitly downstream of detection, so it doesn't require displacing an existing RBI-blessed tool. It plugs into the gap RBI's own governance pipeline leaves open (see `01-PROBLEM-STATEMENT.md`, "structural, not just slow").
- **Reduces the bank's own legal exposure** — every full-freeze-turned-lawsuit case in the evidence base (Malabar Gold, Neelkanth, and IOB's own S.A. Enterprises penalty) is a cost this product is designed to prevent, which is a much easier ROI story for a bank's legal/compliance budget owner than "faster investigations" alone.
- **DPIP-alignment, stated precisely**: Muskets should be described as *integrating with DPIP's intelligence feed*, not replacing or acting as a freeze engine — DPIP shares intelligence, it does not execute freezes itself. Overstating this in a pitch is an easy factual error to get caught on.

---

## Open product questions the survey is meant to resolve

Per project rules, everything below is a **product hypothesis**, not a validated fact, until survey responses come in (currently 0 responses, sent 26-04-2026):

- Do investigators actually experience the "six disconnected systems" friction as the dominant time cost, or is something else (approval latency, staffing, legal review turnaround) the bigger bottleneck in practice?
- Is the proportional-lien recommendation something investigators would trust from an AI system, or does it need a stronger human-override-by-default posture than currently designed?
- Which of the three roles has the most acute pain today — is it evenly distributed, or concentrated in one role (likely AML Investigation Officer)?

---

## See also

- `01-PROBLEM-STATEMENT.md` — the gap this solution responds to
- `03-RESEARCH-EVIDENCE.md` — sourcing and confidence tiers for every regulatory/legal claim referenced above
- `04-PROTOTYPE-STATUS.md` — what of this vision is actually built vs. still aspirational
