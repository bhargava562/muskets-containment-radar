package com.muskets.backend.detection.engine;

/**
 * Per-account running state — the "box of numbers" that makes O(1) detection possible.
 *
 * <p>This class is <b>package-private</b> — it is not a Spring bean and must never
 * be referenced from outside {@code detection.engine}. Each account tracked by
 * the PreFlaggerEngine gets exactly one instance of this class.</p>
 *
 * <p>Every field is a running aggregate, not a list of past transactions.
 * That's the whole trick: updating these numbers is a fixed number of
 * arithmetic operations regardless of account history length.</p>
 */
class AccountState {

    // ── Welford's online algorithm for streaming Z-score ──────────────
    // Tracks count, running mean, and M2 (sum of squared deviations).
    // O(1) per update: 3 additions, 2 multiplications, no stored history.
    long txnCount = 0;
    double runningMean = 0.0;
    double runningM2 = 0.0;

    // ── Balance trajectory (draining detection) ───────────────────────
    // Consecutive transactions with balance < 0.
    // Reset to 0 on any positive balance.
    double lastBalance = 0.0;
    int negativeBalanceStreak = 0;

    // ── Debit velocity / fragmentation (ring buffer) ──────────────────
    // Fixed-size array — oldest entry overwritten, never grows.
    // 50 slots = "last 50 debit timestamps", always exactly 50 comparisons.
    long[] recentDebitTimestamps = new long[50];
    int ringIndex = 0;

    // ── Account-age risk (computed once on first transaction) ─────────
    long accountAgeDays = -1;
    boolean ageRiskFlag = false; // true if account age < threshold at first observed activity

    // ── Tracking ──────────────────────────────────────────────────────
    // Whether this account has already emitted an alert (prevent duplicate storms)
    boolean hasEmittedP1 = false;
    boolean hasEmittedP2 = false;
}
