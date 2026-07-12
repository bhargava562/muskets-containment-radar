# Research Evidence Base

**Compiled for IOB Cybernova 2026 | Source: `factsbase.txt` | Last verified: 10 July 2026**

This is the empirical backbone for `01-PROBLEM-STATEMENT.md` and `02-SOLUTION.md`. It exists as a separate document deliberately: **every claim used in the pitch must be traceable to a tier below, and nothing above Tier 2 should be spoken to judges as fact.**

## Confidence tier legend

| Tag | Meaning | Usage rule |
|---|---|---|
| 🟢 **VERIFIED** | Independently confirmed via a primary source (court order, government PDF, official press release). | Safe to cite with the source given. |
| 🟡 **SOURCED, NOT RE-CHECKED** | Came from a research pass with real citations, internally consistent with verified facts, but the primary source was not personally re-fetched. | Treat as probably true; verify before using in a written/judged submission. |
| 🔴 **DO NOT USE** | Searched for directly, no matching primary source found. Likely fabricated or misremembered. | Removed from the working set — see the exclusion list at the bottom of this doc. |

---

## A. MuleHunter.AI — official facts 🟢

- Announced by RBI Governor Shaktikanta Das, 6 December 2024, during the Monetary Policy Committee statement. Built in-house by the Reserve Bank Innovation Hub (RBIH), a wholly-owned RBI subsidiary. *(Business Standard, 6 Dec 2024)*
- Positioned as a machine-learning alternative to banks' existing static rule-based detection, which RBI says produces high false positives and long turnaround times. *(RBIH statement via FintechFutures/MediaNama, Dec 2024)*
- Built on 19 distinct behavioural patterns of mule accounts, developed with partner banks. *(Business Standard, CDO Magazine, Banking Frontiers, Dec 2024)*
- Initial pilot: 2 large PSU banks. *(FintechFutures, 29 Mar 2025)*
- RBIH's own site claims "85%+ accuracy, and constant learning." *(rbihub.in/projects/mulehunter)*

## B. Adoption timeline 🟢

| Date | Banks live | Detail |
|---|---|---|
| Dec 2024 | 2 (pilot) | Two large PSU banks |
| Aug 2025 | 6 | Canara Bank, PNB, Bank of India, Bank of Baroda, AU SFB live; Federal Bank in advanced stages. ~90% "positive alert" rate claimed vs. ~80% false positives on other platforms (CGM Suvendu Pati, Business Standard 1 Aug 2025) |
| Nov 2025 | ~20 | RBI Governor Sanjay Malhotra statement |
| 10 Dec 2025 | 23 (confirmed) | RBI's own RTI response to MediaNama |
| Early 2026 | 26 | PIB press release |
| Mar 2026 | — | 🟡 Single-source claim that MHA directed all financial institutions to integrate with MuleHunter by Dec 2026 (The420.in) — confirm against an actual MHA circular before citing as a hard mandate |

**Framing note:** ~13 months to go from 2 to ~26 of India's 100+ scheduled commercial banks, for a free RBI-provided tool. Worth asking directly in the pitch: if cost isn't the friction, what is?

## C. The core gap — detection without freeze authority 🟢

This is the strongest, most load-bearing evidence in the base.

- **BNSS 2023, Section 106** (replacing CrPC Section 102) permits *seizure* for evidentiary purposes only. **Section 107** (attachment/freezing of "proceeds of crime") requires a Magistrate's order. Neither banks nor police can unilaterally freeze a full account on suspicion alone.
- **Malabar Gold and Diamond Ltd. v. Union of India**, W.P.(C) 4198/2025, Delhi HC, 16 Jan 2026 (2026 SCC OnLine Del 297 / 2026 LiveLaw (Del) 166). ₹80,10,857 frozen with no FIR/complaint against Malabar Gold itself; ruled "manifestly arbitrary," violating Art. 19(1)(g) and 21. Reinforces *Neelkanth Pharma Logistics* and *Kartik Yogeshwar Chatur v. Union of India* (2025 SCC OnLine Bom 4778).
- **Neelkanth Pharma Logistics Pvt Ltd v. Union of India** (HDFC Bank case), Delhi HC, 2025. Full freeze over a ₹200 disputed credit. Court's recommendation, the single best supporting quote in the base: *"The possibility of marking a lien on disputed amount, whenever it is identifiable, should be explored as a more appropriate interim measure. Ideally, it should be the first and foremost option."* Also recommended MHA develop a uniform national SOP — confirming none currently exists.
- **Pawan Kumar Rai v. Union of India**, 2024 SCC OnLine Del 8936, Delhi HC — earlier precedent, freezing without indication of complicity violates Article 21 (right to livelihood).
- **Kerala High Court** (Nov 2025) laid out a stopgap procedure absent an RBI/MHA SOP: immediate debit freeze (not full freeze) on reasonable suspicion, same-day SMS + registered post notice, report to jurisdictional Cyber Crime Police, 1-week response window, max 3-month freeze, auto-lift if unresolved. Court explicitly directed RBI to frame a national SOP.
- **IBA (Indian Banks' Association)** has itself lobbied RBI for unilateral freeze authority over suspected mule accounts — direct industry admission that banks lack this power today. *(MediaNama, 14 Apr 2025)*

## D. IOB-specific evidence 🟢 — use this by name in the pitch

**M/S S.A. Enterprises v. RBI**, Allahabad HC, 2026 LiveLaw (AB) 282.

- IOB fined ₹50,000 for freezing a fisheries-machinery firm's account after a legitimate ₹23 lakh RTGS credit, with no formal complaint or investigating-authority order.
- IOB's Section 12(2) PMLA justification (credit "suspicious" relative to declared income) was rejected — no bank guideline barring above-income credits, no third-party complaint, and IOB had run what the Court called a "self-declared investigation."
- Quotable Court language: **"Bank Can't Metamorphose Into Investigating Agency."**
- IOB directed to de-freeze immediately and pay compensation within 4 weeks.

*This is the single most important citation for a hackathon judged by IOB — it is their own institution, penalized this year, for the exact failure mode the product prevents.*

## E. National outcome & recovery data 🟢

| Metric | Figure | Period |
|---|---|---|
| Amount stopped/held by CFCFRMS | ₹7,647 crore | Apr 2021–Nov 2025 |
| Amount actually restored to victims | ₹167 crore (**2.18%** of stopped) | Same period |
| Total reported to CFCFRMS | ₹52,969 crore | Apr 2021–Nov 2025 |
| Amount saved (2024) | ₹5,489 crore / 17.82 lakh complaints | 2024 |
| Amount saved (updated) | ₹7,130 crore / 23.02 lakh complaints | up to ~Dec 2025 |
| Total cyber-fraud losses | ₹22,845.73 crore (+206% YoY from ₹7,465.18 cr) | 2024 vs 2023 |
| Total cyber-fraud complaints | 36.37 lakh (up from 24.42 lakh) | 2024 vs 2023 |
| I4C Suspect Registry — mule accounts identified | 24.67 lakh | since 10 Sep 2024 |
| I4C Suspect Registry — transactions declined | ₹8,031.56 crore | same window |

**Strongest single "opacity" finding:** RBI's own RTI response to MediaNama (Dec 2025) states RBI **cannot disclose** how many mule accounts MuleHunter has identified or acted upon (fiduciary/competitive-harm exemptions under RTI Act 2005), holds **no information on formal I4C coordination** specific to MuleHunter, and has **no internal circulars/advisories** specific to the tool. RBI's own records don't centrally track MuleHunter's outcomes. 🟢

## F. MuleHunter technical specifics and their documented gaps 🟡

- No public documentation of MuleHunter's exact input specification (device fingerprints, IP, CDR, UPI VPA behaviour) — gated behind RBIH's "Pratirupa" partner login.
- "Seamlessly integrates with EFRMS/AML systems" — but whether output is a binary flag, risk score, or full case file is undocumented.
- **No official latency SLA exists** — "near real-time" is marketing language with no published number.
- RBI Master Direction on Fraud Risk Management (15 Jul 2024) requires classified-fraud reporting to RBI within 21 days — a *reporting* deadline, not an *act-on-alert* deadline. **No RBI-mandated freeze/escalation SLA exists.**
- I4C–RBIH MoU (reported 12 May 2026) implies MuleHunter and I4C's Suspect Registry are **not yet integrated** as of now.

## G. Adjacent systems — cite precisely 🟢

- **DPIP** (Digital Payment Intelligence Platform, inaugurated 10 Sep 2024): Phase 1 = negative registry (telecom + I4C data sharing); Phase 2 = real-time pre-transaction risk scoring. **DPIP shares intelligence; it does not execute freezes.** Describe integration as feeding an intelligence layer, not a freeze engine.
- **IDPIC** (Indian Digital Payment Intelligence Corporation): RBI-approved Section 8 company, ₹500cr authorized / ₹200cr paid-up capital, led by SBI + Bank of Baroda, explicitly built on RBI's MuleHunter.ai. Context stat: bank-fraud value nearly tripled, ₹12,230cr (FY24) → ₹36,014cr (FY25) — the headline urgency stat behind IDPIC's creation.

## H. The regulatory pipeline that explains the delay 🟢

RBI Master Direction on Fraud Risk Management (RBI/DOS/2024-25/118, 15 Jul 2024):

**EWS → Red-Flagged Account (report to CRILC within 7 days) → mandatory 21-day Show Cause Notice (post-*SBI v. Rajesh Agarwal*) → classification decision within 180 days → Fraud Monitoring Return → police/CBI/SFIO notification by threshold.**

No numeric SLA for freezing/containment exists anywhere in this pipeline — the structural explanation for the bottleneck (see `01-PROBLEM-STATEMENT.md`).

## I. EFRMS and containment mechanics 🟢 (with one 🟡 caveat)

- EFRMS is separately vendor-procured (confirmed via a public Bank of Maharashtra RFP specifying CBS/Treasury/UPI/ATM/POS/AML/NACH integration). Known vendors: Clari5, Manipal Technologies (CrossFraud Suite), IDBI Intech (i-FRMS), Feedzai.
- **Finacle** (the CBS platform IOB and most PSU banks run) already supports: Freeze Flags (`AFSM`/`ACS`: Total/Debit/Credit, account or customer level) and separate **lien marking** (`HALM`-style) that holds a specific amount while the rest stays liquid. This is the real proportional-hold mechanism — it already exists in the CBS layer. **The gap is the missing automatic trigger from a risk alert, not missing CBS capability.**
- 🟡 A referenced Kerala Gramin Bank RFP requiring vendor support for "integration with RBIH MuleHunter.ai... as and when access, interface, approval and technical specifications are made available" was not independently re-verified in this pass — a strong citation if confirmed, since the phrasing implies standardized integration specs don't yet exist.
- Do **not** use any specific JSON payload examples, Kafka topic names, or Finacle menu names beyond the two confirmed above (`AFSM`/`ACS`, `HALM`) — anything more granular in earlier drafts was unsourced invention.

## J. Additional case law for proportional containment 🟢

- **Mohammed Saifullah v. Reserve Bank of India** (Madras HC) — mandates proportionality in account freezing by investigating authorities.
- **Vivek Varshney & Anr v. Union of India & Ors** (Supreme Court, Jan 2026, pending) — Supreme Court itself has noted the **absence of a uniform national SOP** for freezing/unfreezing accounts and is being asked to mandate national guidelines. **This is the single strongest "no SOP exists" citation available** — Supreme Court level, and currently live.
- **Dekain Perfect Tech Ksolution v. IDFC First Bank** (MP HC, 22 Jun 2026) and **Malcolm Murayis v. State Bank of India** (MP HC, Apr 2024) — same fact pattern, but against IDFC First Bank and SBI, **not IOB**. Cite carefully by correct bank name.

## K. STR/evidence packaging reality 🟢

- STRs filed with FIU-IND via **FINGate 2.0**; must be "factual, concise," with supporting documentation. SEBI intermediaries face a 7-working-day deadline from suspicion; banks operate under an analogous PMLA obligation.
- The STR narrative is **manually written** — no public evidence any Indian bank EFRMS or MuleHunter auto-drafts it.
- MuleHunter's literature describes it as privacy-preserving and locally-contained by design — implying it likely does **not** reach into CKYC or device-registry systems. Privacy-by-design and evidence-aggregation are in structural tension.

---

## 🔴 Explicitly excluded — do not cite these under any circumstances

These were searched for directly and could not be verified. If any appear in earlier drafts, remove them:

- *"Goswami Traders v. Indian Overseas Bank"* and *"Anita Chouhan v. Indian Overseas Bank"* (both claimed MP HC, Feb 2026) — no matching case; the real MP HC case in this fact pattern names **IDFC First Bank**, not IOB.
- *"Khalsa Medical Store v. RBI"* — no match; likely a garbled restatement of the real, correctly-cited *S.A. Enterprises v. RBI* (Section D above).
- *"Shah Rukh Pathan v. Union of India"* and *"M. Nandakumar v. RBI"* — no matching cases found.
- *"Dr. Shashi Kumar v. State"* — no matching case. Already replaced in this doc with Malabar Gold + Neelkanth Pharma Logistics + Pawan Kumar Rai, which say the same thing and are fully verified.
- Any specific IOB pilot yield number (e.g. "flagged 1,200+ mule accounts in two months") attributed to an unfound RBIH press release — do not cite a specific number unless a primary source is located.
- Any detailed MuleHunter→EFRMS JSON payload, Kafka topic names, or invented Finacle menu names beyond `AFSM`/`ACS`/`HALM` — these read as plausible invention with no cited source.

**Only Indian Overseas Bank court case currently verified: `M/S S.A. Enterprises v. RBI`, 2026 LiveLaw (AB) 282 (Section D). Do not inflate the IOB-specific case count.**

---

## Recommended citation order for the pitch deck

1. IOB-specific penalty: *S.A. Enterprises v. RBI*, 2026 LiveLaw (AB) 282
2. Core legal mechanism: *Malabar Gold v. Union of India*, Delhi HC, 16 Jan 2026
3. Product's mandate in the court's own words: *Neelkanth Pharma Logistics* — "lien on disputed amount... first and foremost option"
4. Recovery-rate crisis stat: ₹7,647cr stopped vs. ₹167cr restored (2.18%)
5. Opacity/no-SLA gap: RBI's own RTI admission + confirmed absence of freeze SLA in the Master Direction
6. Urgency/scale stat: bank fraud ₹12,230cr → ₹36,014cr, FY24→FY25
7. Judicial call for exactly this solution: Kerala HC + Neelkanth Pharma Logistics + the pending Supreme Court case (*Vivek Varshney*)

## Open verification items before final submission

- Confirm the Kerala Gramin Bank RFP (Section I) directly if it's going to be cited by name.
- Find a primary source for any Recall/Precision/Latency validation metrics before presenting them as fact — none currently exist in this base.
- No penalty figure beyond the confirmed ₹50,000 (IOB) exists in this evidence base — do not cite any other amount (e.g., a "₹9 Cr" figure referenced in early drafts remains unsourced and should not be used).

---

## See also

- `01-PROBLEM-STATEMENT.md` — how this evidence supports the problem framing
- `02-SOLUTION.md` — how this evidence supports the product's positioning
