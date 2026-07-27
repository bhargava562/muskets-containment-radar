# Muskets Detection Engine & Mathematical Algorithms — Technical Specification

This document provides the complete mathematical, algorithmic, and data schema specification of the **Muskets Detection & Graph Engine** (PFCE — Precision Fund Containment Engine) implemented in Spring Boot 4.1.0 and JDK 25.

---

## 1. Core Architecture Decisions

### The Two-Speed Rule

To achieve sub-millisecond execution speeds under high transactional volume, the module enforces a strict separation between two operations running at different speeds:

*   **Job 1 (`PreFlaggerEngine`):** Evaluates every incoming transaction. Runs in $O(1)$ constant time with bounded memory, updating a per-account state object (`AccountState`) using incremental algorithms. It never queries the database or performs relational tracing.
*   **Job 2 (`PostOperatorEngine`):** Executes on-demand when an analyst initiates an investigation. It traverses the transaction database outwards using a bounded Breadth-First Search (BFS) to map the flow of funds to downstream accounts.

### Module Boundaries & Loose Decoupling
To ensure this module can be safely modified or removed without breaking downstream applications, the design enforces a strict package boundary:
*   Nothing outside the `com.muskets.backend.detection` package is allowed to import classes from within it.
*   Enforced via an **ArchUnit** test (`ModuleBoundaryTest.java`) that fails the build if an import leakage occurs.
*   The only communication channel is `MuleFlaggedEvent.java` in `shared/events`. Any downstream system listens for this event asynchronously using standard Spring `@EventListener` annotations.

---

## 2. Input Data Schemas

### 2.1 Account Attributes Schema (`AccountState`)
| Field | Data Type | Description |
|:---|:---|:---|
| `accountId` | `String` | Unique account identifier (e.g. `185502000087321`) |
| `customerType` | `Enum` | `INDIVIDUAL` or `BUSINESS` |
| `accountAgeDays` | `int` | Lifetime of account in days |
| `kycStatus` | `String` | Verification status (e.g., `VERIFIED_C_KYC`) |
| `branchLocation` | `String` | Issuing branch name and code |
| `totalBalance` | `double` | Current ledger balance in INR |
| `lienAmount` | `double` | Currently active CBS lien amount |

### 2.2 Transaction Attributes Schema (`TransactionEvent`)
| Field | Data Type | Description |
|:---|:---|:---|
| `txnId` | `String` | Unique transaction reference (e.g. `TXN87321009`) |
| `fromAccount` | `String` | Source account identifier |
| `toAccount` | `String` | Destination account identifier |
| `amount` | `double` | Transaction value in INR |
| `timestamp` | `long` | Epoch timestamp in milliseconds |
| `channel` | `Enum` | `UPI`, `IMPS`, `NEFT`, or `ATM` |
| `narration` | `String` | Transaction memo or narration text |

### 2.3 Network & Telemetry Attributes Schema
| Field | Data Type | Description |
|:---|:---|:---|
| `deviceHash` | `String` | Hardware fingerprint of origin device |
| `simChangedIn72h` | `boolean` | Flag for recent SIM card swap |
| `failedLoginAttempts` | `int` | Count of failed authentication attempts |
| `geoVelocityFlag` | `boolean` | Impossible travel/location velocity flag |
| `linkedComplaintId` | `String` | NCRP 1930 Cyber Crime Portal complaint ID |

---

## 3. Mathematical Algorithms & Formulas

### 3.1 Signal 1: Z-Score Anomaly (Welford's Algorithm)

To compute mean and variance in $O(1)$ constant time without maintaining transaction history lists in memory, `PreFlaggerEngine` implements **Welford's Online Algorithm**:

$$M_1 = x_1, \quad M_k = M_{k-1} + \frac{x_k - M_{k-1}}{k}$$

$$S_1 = 0, \quad S_k = S_{k-1} + (x_k - M_{k-1})(x_k - M_k)$$

Standard deviation:
$$\sigma_k = \sqrt{\frac{S_k}{k-1}}$$

Self-Calibrated Z-Score:
$$Z_k = \frac{x_k - M_k}{\sigma_k}$$

**Threshold Trigger**: $|Z_k| > 3.0$ (3-sigma statistical deviation relative to the account's own transaction baseline).

---

### 3.2 Signal 2: Fragmentation Ratio ($FR$) — Layering Intensity

Measures smurfing/layering activity by comparing rapid outbound transfers to historical daily baseline:

$$FR = \frac{\text{Outbound Splits in } 10 \text{ minutes}}{\text{Historical Daily Average Outbound Splits}}$$

**Threshold Trigger**: $FR > 3.0$ (Indicates active structuring/layering node).

---

### 3.3 Signal 3: Propagation Velocity Index ($V$)

$$V = \frac{\text{Outbound Transaction Count}}{\Delta t \text{ (minutes)}}$$

**Threshold Trigger**: $V > 10.0 \text{ tx/min}$ (Indicates bot-automated mule distribution).

---

### 3.4 Signal 4: Fund Retention Duration ($T_{\text{dwell}}$)

$$T_{\text{dwell}} = t_{\text{first\_outbound}} - t_{\text{inbound\_credit}}$$

**Threshold Trigger**: $T_{\text{dwell}} < 5 \text{ minutes}$ (High-velocity relay), $< 2 \text{ minutes}$ (Critical automated relay).

---

### 3.5 Composite Account Risk Scoring Formula

$$R_{\text{composite}} = \min\left(100, \, w_{\text{txn}} \cdot R_{\text{txn}} + w_{\text{net}} \cdot R_{\text{net}} + w_{\text{beh}} \cdot R_{\text{beh}} + w_{\text{ev}} \cdot R_{\text{ev}}\right)$$

Where:
- $R_{\text{txn}} = \min(100, \, 30 \cdot |Z| + 20 \cdot FR)$
- $R_{\text{net}} = (\text{In-Degree} \times 15) + (\text{Out-Degree} \times 25) + (\text{Flow Volume Weight})$
- $R_{\text{beh}} = 25 \cdot \mathbb{I}(\text{AccountAge} < 30\text{d}) + 25 \cdot \text{NegativeBalanceStreak}$
- $R_{\text{ev}} = 30 \cdot \mathbb{I}(\text{Linked NCRP Complaint}) + 20 \cdot \mathbb{I}(\text{SIM Swap } 72\text{h})$

---

### 3.6 Proportional Lien Calculation

Instead of freezing 100% of an account:

$$\text{Lien Amount } (L) = \min\left(\text{Available Balance}, \, \text{Traced Fraudulent Inflow}\right)$$

$$\text{Free Working Capital } (F) = \max\left(0, \, \text{Available Balance} - L\right)$$

---

## 4. Job 2: Bounded Relational Tracing (BFS Algorithm)

`PostOperatorEngine` registers transactions in a bidirectional in-memory index.
When an investigation starts, it runs a Level-Order Breadth-First Search (BFS) starting from the flagged account:

```
Algorithm 1: Bounded BFS Relational Graph Construction
Input: Trigger Account A_0, MaxHops = 4, TimeWindow = 48 Hours
Output: Suspect Network Graph (Nodes N, Edges E)

1: Queue Q <- [A_0]
2: Visited <- {A_0}
3: CurrentHop <- 0
4: While Q is not empty and CurrentHop < MaxHops do
5:     LevelSize <- Size(Q)
6:     For i = 0 to LevelSize - 1 do
7:         Account A <- Pop(Q)
8:         For each Txn T in GetRecentTransactions(A, 48h) do
9:             Add Edge (T.from, T.to, T.amount) to E
10:            Target <- (T.from == A) ? T.to : T.from
11:            If Target not in Visited then
12:                Add Target to Visited and Push Target to Q
13:                Add Node(Target) to N
14:            End If
15:        End For
16:    End For
17:    CurrentHop <- CurrentHop + 1
18: End While
19: Return Graph(N, E)
```

---

## 5. Deployment & Execution Setup

### Execute Tests
Run unit tests, integration tests, and ArchUnit boundary checks:
```bash
cd backend && ./mvnw test -Dspring.profiles.active=test
```

### Build and Launch Application
Package the JAR and run:
```bash
cd backend && ./mvnw clean package -DskipTests
java -jar target/*.jar
```

### Replay Data Feed Test
To test detection thresholds against `sample_mule_account_data.csv`:
```bash
curl -X POST http://localhost:8080/api/detection/replay-csv
```
