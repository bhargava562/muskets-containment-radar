# Muskets Detection Module — Implementation Documentation

This document describes the technical implementation of the **Muskets Detection Module** (PFCE — Precision Fund Containment Engine) in the Spring Boot backend, grounded in the `sample_mule_account_data.csv` dataset.

---

## 1. Core Architecture Decisions

### The Two-Speed Rule
To achieve sub-millisecond execution speeds under high transactional volume, the module enforces a strict separation between two operations running at different speeds:

*   **Job 1 (Pre-Flagger Engine):** Evaluates every incoming transaction. Runs in $O(1)$ constant time with bounded memory, updating a per-account state object (`AccountState`) using incremental algorithms. It never queries the database or performs relational tracing.
*   **Job 2 (Post-Operator Engine):** Executes on-demand when an analyst initiates an investigation. It traverses the transaction database outwards using a bounded Breadth-First Search (BFS) to map the flow of funds to downstream accounts.

### Module Boundaries & Loose Decoupling
To ensure this module can be safely modified or removed without breaking downstream applications (like the alert queue or workspace frontends), the design enforces a strict package boundary:
*   Nothing outside the `com.muskets.backend.detection` package is allowed to import classes from within it.
*   Enforced via an **ArchUnit** test (`ModuleBoundaryTest.java`) that fails the build if an import leakage occurs.
*   The only communication channel is `MuleFlaggedEvent.java`, which lives in a separate `shared/events` package. Any downstream system listens for this event asynchronously using standard Spring `@EventListener` annotations.

---

## 2. In-Depth Class Breakdown

The module is structured as follows:

```
src/main/java/com/muskets/backend/
├── shared/
│   └── events/
│       └── MuleFlaggedEvent.java         # Immutable event envelope
├── alerts/
│   ├── AlertLogEntity.java               # JPA Entity for H2 alert logs
│   ├── AlertLogRepository.java           # JPA Repository
│   └── MuleFlaggedEventListener.java     # Event listener & API endpoint
└── detection/                            # Completely self-contained module
    ├── DetectionConfig.java              # Tunable thresholds config
    ├── engine/
    │   ├── AccountState.java             # Bounded running totals (package-private)
    │   ├── PreFlaggerEngine.java         # Job 1 O(1) rules engine
    │   └── PostOperatorEngine.java       # Job 2 Bounded BFS graph engine
    ├── ingest/
    │   └── TransactionIngestController.java # REST API endpoints
    └── model/
        ├── TransactionEvent.java         # Input transaction representation
        └── MuleNetworkGraph.java         # Output network graph format
```

---

## 3. Implementation Details

### Job 1: Streaming Statistical Flags
`PreFlaggerEngine` maintains a thread-safe registry of `AccountState` objects in a `ConcurrentHashMap`. For every transaction, it computes five signals in constant time:

1.  **Z-Score Anomaly (Welford's Algorithm):** 
    Updates the mean and variance of transaction amounts incrementally without keeping history:
    $$M_{1} = x_1, \quad M_{k} = M_{k-1} + \frac{x_k - M_{k-1}}{k}, \quad S_k = S_{k-1} + (x_k - M_{k-1})(x_k - M_k)$$
    Standard deviation is computed as $\sigma = \sqrt{S_k / (k-1)}$. This allows calculating a self-calibrating Z-score $Z = (x_k - \mu) / \sigma$ for every transaction amount, judging each account against its own history.
2.  **Negative Balance Streak:**
    Tracks the consecutive number of transactions where `balance < 0`. If a credit moves the balance above zero, the streak resets immediately.
3.  **Fragmentation Velocity (Ring Buffer):**
    Maintains a fixed-size `long[50]` ring buffer of timestamps for debit transactions. This limits velocity evaluation to a fixed number of operations ($O(50)$), avoiding growing lists or memory leaks.
4.  **Account-Age Risk Weight:**
    Calculated once upon the first transaction seen by using the account opening date (`ACCT_OPN_DATE`). If the account was opened less than 30 days prior, it adds an additional risk multiplier.

### Job 2: Bounded Relational Tracing
`PostOperatorEngine` registers transactions containing `counterpartyAcid` (the target account) in a bidirectional in-memory index.
When an investigation starts, it runs a Level-Order BFS traversal starting from the flagged account:
*   **Hop Limit:** Traversal stops at `MAX_HOPS = 4` to prevent mapping massive fractions of the banking network.
*   **Time Window Limit:** Only traverses transactions occurring within the last 48 hours relative to the trigger event.

---

## 4. Deployment Setup

### Database Architecture
*   **H2 Database (File-Mode):** Embedded database stored under `./data/muskets`. It operates in-process, eliminating the overhead of network roundtrips and connection pool negotiation.
*   **Flyway Migrations:** Schema is managed version-by-version under `src/main/resources/db/migration/V1__create_alert_log.sql`. This uses highly portable ANSI SQL, allowing an instant switch to PostgreSQL or any SQL database in the future by updating connection strings in `application.yaml`.
*   **H2 Web Console:** Disabled by default in all profiles (`spring.h2.console.enabled=false`) to eliminate the JNDI remote code execution vector (CVE-2021-42392).

### Railway Deployment
The backend is deployed as a native JAR on Railway. Railway automatically detects the Maven project, runs `./mvnw clean package -DskipTests`, and starts the resulting JAR. The `PORT` environment variable is injected by Railway at runtime via `server.port: ${PORT:8080}` in `application.yaml`.

### GitHub Actions Integration (`/.github/workflows/ci.yml`)
The CI workflow validates backend compilation using `./mvnw clean verify -DskipTests` with JDK 25 (Temurin) on Ubuntu. Maven dependencies are cached for faster builds.

---

## 5. Security & Secret Protection

### CSV Exclusions
The primary dataset `sample_mule_account_data.csv` is marked as a restricted document. It is excluded from version control:
*   Added to root `.gitignore` and `backend/.gitignore`.

---

## 6. How to Run and Verify

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

Access the backend API at `http://localhost:8080`. The Spring Boot backend serves the API endpoints (`/api/**`).

### Replay Data Feed
To test detection thresholds against the `sample_mule_account_data.csv` dataset, send an explicit REST trigger:
```bash
curl -X POST http://localhost:8080/api/detection/replay-csv
```
This triggers parsing and streaming execution, outputting a summary of flagged accounts.
