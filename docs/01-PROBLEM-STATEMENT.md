# Problem Statement

**IOB Cybernova 2026 — Problem Statement 2: Advanced Controls for Mule Account Detection and AML Compliance**

> Status: Research-validated (see `03-RESEARCH-EVIDENCE.md`). Product assumptions built on top of this are still unvalidated pending bank-staff survey results.

---

## The one-sentence problem

**MuleHunter.AI finds bad accounts fast. Banks still cannot act on that information fast enough — because after the alert fires, there is no connected system, only a chain of disconnected manual steps that eats the small window of time available before the money disappears.**

This is not a detection problem. Detection is the one link in this chain that is already solved.

---

## Why "just use MuleHunter" is not a real answer

MuleHunter.AI is RBI's own machine-learning detection tool, built in-house by the Reserve Bank Innovation Hub (RBIH). It is free, government-backed, and — per RBIH's own claims — over 85% accurate. As of the most recent confirmed count, it is live at 23–26+ scheduled commercial banks (up from a 2-bank pilot in December 2024).

Given that, the obvious question a judge will ask is: **"If detection already exists and is free, why do banks still lose money to mule networks?"**

The answer is the gap this project targets: **detection produces a risk score in near-real-time; the operational and legal machinery that turns that score into action does not move at the same speed.**

---

## The five-step failure chain

1. **A scam happens.** Money moves from a victim's account through a chain of mule accounts within minutes, then exits via cash withdrawal or crypto conversion. This "pass-through account" pattern is documented by RBI, RBIH, and I4C.

2. **MuleHunter catches it.** The detection layer works. An account gets flagged.

3. **The alert lands on a human who has to build a case from scratch.** No system hands the investigator a unified view. They manually visit the core banking system, KYC records, transaction history, device logs, and prior complaint records — one at a time, in different tools.

4. **While the investigator gathers information, the money keeps moving.** This is the actual bottleneck. It's not that detection fails or that the law is unreasonable — it's that the fastest available response is still slower than the criminal's next hop.

5. **Under time pressure, banks default to the legally wrong action: a full account freeze.** Indian courts have now repeatedly ruled this disproportionate (see below). Doing the legally correct thing — a proportional lien on only the traced amount — requires exactly the fast, organized case understanding that today's fragmented tooling doesn't provide. So banks fall back to the blunt instrument instead.

---

## The regulatory reality: freezing is harder than it looks

- Under the **Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023**, Section 106 allows police to *seize* property for evidentiary purposes only. Actual *attachment/freezing* of proceeds of crime requires Section 107 and a **Magistrate's order**. Banks and police cannot unilaterally freeze a full account on suspicion alone.

- A consistent 2025–2026 line of High Court rulings has struck down blanket freezes as disproportionate and unconstitutional (Article 19(1)(g), Article 21):
  - **Malabar Gold and Diamond Ltd. v. Union of India** (Delhi HC, 16 Jan 2026) — ₹80,10,857 frozen over a third party's alleged fraud, no FIR against Malabar Gold itself; freeze ruled "manifestly arbitrary."
  - **Neelkanth Pharma Logistics v. Union of India** (Delhi HC, 2025) — entire account frozen over a ₹200 disputed credit. The Court's own recommendation is effectively this project's mandate stated in judicial language: *"The possibility of marking a lien on disputed amount, whenever it is identifiable, should be explored as a more appropriate interim measure. Ideally, it should be the first and foremost option."*
  - **Vivek Varshney v. Union of India** (Supreme Court, Jan 2026, pending) — the Supreme Court itself has noted the **absence of a uniform national SOP** for freezing and unfreezing accounts in cybercrime cases.

- **Indian Overseas Bank has already been penalized for exactly this failure mode.** In *M/S S.A. Enterprises v. RBI* (Allahabad HC, 2026 LiveLaw (AB) 282), IOB was fined ₹50,000 for freezing a fisheries-machinery firm's account after a legitimate ₹23 lakh RTGS credit, with no formal complaint or investigating-authority order. The Court's language: **"Bank Can't Metamorphose Into Investigating Agency."** This is not a hypothetical risk — it is IOB's own institution, penalized this year, for the precise problem this project addresses.

---

## Why the delay is structural, not just "manual process is slow"

The RBI Master Direction on Fraud Risk Management (RBI/DOS/2024-25/118, effective 15 July 2024) defines the governance pipeline most bank-generated alerts (like a MuleHunter flag) would enter:

**EWS → Red-Flagged Account (report to CRILC within 7 days) → mandatory 21-day Show Cause Notice → fraud classification within 180 days → Fraud Monitoring Return to RBI.**

**This pipeline has no numeric SLA for freezing or containment anywhere in it.** Compare this to the separate, complaint-driven CFCFRMS/1930 helpline track, which does carry an emergency response window — but a MuleHunter alert is a bank-generated signal, not a citizen complaint, so it most plausibly defaults into the slow governance track (weeks to 180 days), not the fast track.

This is a specific, falsifiable, evidence-grounded explanation for the bottleneck — stronger than a general "the process feels slow" claim, and it is the load-bearing argument for the whole pitch.

---

## What is *not* the problem (and why that framing matters for judges)

| Claim | Verdict |
|---|---|
| "MuleHunter's accuracy is the problem" | ❌ No public evidence of this; RBIH claims 85%+ and it is not this project's place to dispute an unpublished internal metric. |
| "Banks lack legal freeze powers" | ⚠️ Partially true but a *symptom* — courts want proportional response, not blanket refusal to act. |
| "Evidence/documentation for STR filing is the bottleneck" | ⚠️ A real downstream cost (STR narratives are manually written, confirmed no auto-drafting exists), but not the root cause. |
| **"Investigation and containment coordination is fragmented and too slow relative to fund movement"** | ✅ **This is the root cause**, evidenced by the RBI governance-pipeline gap, the IOB penalty, and the consistent judicial call for a proportional-response mechanism that does not yet exist anywhere. |

---

## What already exists technically (so the pitch doesn't oversell)

Core banking systems (Finacle, which IOB runs) already support the mechanics needed:
- **Freeze flags** (`AFSM`/`ACS` menu): Total / Debit / Credit freeze, at account or customer level.
- **Lien marking** (`HALM`-style menu): holds a specific amount while leaving the rest liquid — this is the real proportional-hold mechanism.

**The gap is not that this capability is missing from core banking. The gap is that nothing currently triggers it automatically from a risk alert, backed by a fast, organized case.** This is the precise, defensible framing to use with judges: *we are not proposing new core banking functionality — we are proposing the missing automation trigger and the workspace that makes triggering it fast and legally defensible.*

---

## See also

- `03-RESEARCH-EVIDENCE.md` — full source list and confidence tiers for every claim above
- `02-SOLUTION.md` — what is being built in response to this problem
- `04-PROTOTYPE-STATUS.md` — what of the solution actually exists in code today
