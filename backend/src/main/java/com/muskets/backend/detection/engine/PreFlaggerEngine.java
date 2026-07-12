package com.muskets.backend.detection.engine;

import com.muskets.backend.detection.DetectionConfig;
import com.muskets.backend.detection.model.TransactionEvent;
import com.muskets.backend.shared.events.MuleFlaggedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Job 1 — The Pre-Flagger Engine.
 *
 * <p>Runs on <b>every single transaction</b>, in O(1) time per call.
 * It never queries a database, never loops through another account's history,
 * never asks "who is connected to this account." It only ever touches the
 * one small {@link AccountState} for the one account in the current transaction.</p>
 *
 * <h3>Algorithm summary</h3>
 * <ol>
 *   <li><b>Welford's online algorithm</b> — streaming Z-score for amount anomaly</li>
 *   <li><b>Balance-streak counter</b> — consecutive negative-balance transactions</li>
 *   <li><b>Ring-buffer velocity</b> — debits-per-window from a fixed-size timestamp array</li>
 *   <li><b>Account-age risk flag</b> — computed once on first observation</li>
 *   <li><b>Composite score</b> — weighted sum → publish {@link MuleFlaggedEvent} if threshold crossed</li>
 * </ol>
 */
@Component
public class PreFlaggerEngine {

    private static final Logger log = LoggerFactory.getLogger(PreFlaggerEngine.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final Map<String, AccountState> accountRegistry = new ConcurrentHashMap<>();
    private final ApplicationEventPublisher eventPublisher;
    private final DetectionConfig config;

    private final AtomicLong totalProcessed = new AtomicLong(0);
    private final AtomicLong alertsEmitted = new AtomicLong(0);

    public PreFlaggerEngine(ApplicationEventPublisher eventPublisher, DetectionConfig config) {
        this.eventPublisher = eventPublisher;
        this.config = config;
    }

    // ═════════════════════════════════════════════════════════════════
    //  PUBLIC API
    // ═════════════════════════════════════════════════════════════════

    /**
     * Process a single transaction — the hot path.
     * <p>O(1): fixed number of arithmetic operations, no loops over history,
     * no database calls.</p>
     */
    public void processTransaction(TransactionEvent txn) {
        AccountState state = accountRegistry.computeIfAbsent(txn.getAcid(), k -> new AccountState());
        totalProcessed.incrementAndGet();

        // 1. Z-score (compute BEFORE updating stats — score the new value against existing distribution)
        double zScore = calculateZScore(state, txn.getAmount());
        updateAmountStats(state, txn.getAmount());

        // 2. Balance-streak
        updateBalanceStreak(state, txn.getBalance());

        // 3. Velocity (debit ring buffer)
        int debitsInWindow = 0;
        if (txn.isDebit()) {
            recordDebit(state, txn.getTimestampMillis());
            debitsInWindow = countDebitsInWindow(state, txn.getTimestampMillis(),
                    config.getVelocityWindowSeconds());
        }

        // 4. Account-age risk (once)
        if (state.accountAgeDays < 0 && txn.getAcctOpnDate() != null && !txn.getAcctOpnDate().isBlank()) {
            computeAccountAgeRisk(state, txn.getAcctOpnDate(), txn.getTimestampMillis());
        }

        // 5. Composite score → alert
        double riskScore = computeCompositeScore(zScore, state.negativeBalanceStreak,
                debitsInWindow, state.ageRiskFlag);

        emitAlertIfNeeded(txn.getAcid(), state, riskScore,
                describeTrigger(zScore, state.negativeBalanceStreak, debitsInWindow, state.ageRiskFlag),
                txn.getTimestampMillis());
    }

    /** Diagnostic: get state for a specific account. */
    public AccountStateView getAccountState(String acid) {
        AccountState s = accountRegistry.get(acid);
        if (s == null) return null;
        return new AccountStateView(
                s.txnCount, s.runningMean, Math.sqrt(s.txnCount > 1 ? s.runningM2 / (s.txnCount - 1) : 0),
                s.lastBalance, s.negativeBalanceStreak,
                s.accountAgeDays, s.ageRiskFlag,
                s.hasEmittedP1, s.hasEmittedP2
        );
    }

    public int getRegistrySize()        { return accountRegistry.size(); }
    public long getTotalProcessed()     { return totalProcessed.get(); }
    public long getAlertsEmitted()      { return alertsEmitted.get(); }

    /** Reset all state — used for demo/testing. */
    public void reset() {
        accountRegistry.clear();
        totalProcessed.set(0);
        alertsEmitted.set(0);
    }

    // ═════════════════════════════════════════════════════════════════
    //  WELFORD'S ONLINE ALGORITHM — O(1) streaming mean + variance
    // ═════════════════════════════════════════════════════════════════

    private void updateAmountStats(AccountState state, double newAmount) {
        state.txnCount++;
        double delta1 = newAmount - state.runningMean;
        state.runningMean += delta1 / state.txnCount;
        double delta2 = newAmount - state.runningMean;
        state.runningM2 += delta1 * delta2;
    }

    private double calculateZScore(AccountState state, double newAmount) {
        if (state.txnCount < 2) return 0.0; // not enough history — don't judge too early
        double variance = state.runningM2 / (state.txnCount - 1);
        double stdDev = Math.sqrt(variance);
        if (stdDev == 0) return 0.0; // all identical amounts — no deviation
        return (newAmount - state.runningMean) / stdDev;
    }

    // ═════════════════════════════════════════════════════════════════
    //  BALANCE STREAK — increment/reset counter
    // ═════════════════════════════════════════════════════════════════

    private void updateBalanceStreak(AccountState state, double newBalance) {
        if (newBalance < 0) {
            state.negativeBalanceStreak++;
        } else {
            state.negativeBalanceStreak = 0;
        }
        state.lastBalance = newBalance;
    }

    // ═════════════════════════════════════════════════════════════════
    //  VELOCITY — fixed-size ring buffer, O(50) = O(1) bounded scan
    // ═════════════════════════════════════════════════════════════════

    private void recordDebit(AccountState state, long nowMillis) {
        state.recentDebitTimestamps[state.ringIndex] = nowMillis;
        state.ringIndex = (state.ringIndex + 1) % state.recentDebitTimestamps.length;
    }

    private int countDebitsInWindow(AccountState state, long nowMillis, long windowSeconds) {
        long windowStart = nowMillis - (windowSeconds * 1000);
        int count = 0;
        for (long ts : state.recentDebitTimestamps) {
            if (ts >= windowStart && ts > 0) count++;
        }
        return count;
    }

    // ═════════════════════════════════════════════════════════════════
    //  ACCOUNT-AGE RISK — computed once on first transaction
    // ═════════════════════════════════════════════════════════════════

    private void computeAccountAgeRisk(AccountState state, String acctOpnDate, long txnTimestampMillis) {
        try {
            LocalDate openDate = LocalDate.parse(acctOpnDate.trim(), DATE_FMT);
            LocalDate txnDate = java.time.Instant.ofEpochMilli(txnTimestampMillis)
                    .atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            state.accountAgeDays = ChronoUnit.DAYS.between(openDate, txnDate);
            state.ageRiskFlag = state.accountAgeDays < config.getAccountAgeRiskDays();
        } catch (Exception e) {
            // Unparseable date — default to no risk flag, don't block the hot path
            state.accountAgeDays = 999;
            state.ageRiskFlag = false;
        }
    }

    // ═════════════════════════════════════════════════════════════════
    //  COMPOSITE SCORING + ALERT EMISSION
    // ═════════════════════════════════════════════════════════════════

    private double computeCompositeScore(double zScore, int negStreak, int debitsInWindow, boolean ageRisk) {
        double score = 0.0;
        if (Math.abs(zScore) > config.getZScore())             score += 4.0;
        if (negStreak >= config.getNegativeStreak())            score += 4.0;
        if (debitsInWindow > config.getVelocityCount())        score += 3.0;
        if (ageRisk)                                           score += 2.0;
        return score;
    }

    private void emitAlertIfNeeded(String acid, AccountState state, double riskScore,
                                   String triggerReason, long timestamp) {
        if (riskScore >= config.getP1Score() && !state.hasEmittedP1) {
            state.hasEmittedP1 = true;
            alertsEmitted.incrementAndGet();
            log.warn("🚨 P1 ALERT: account={} score={} reason={}", acid, riskScore, triggerReason);
            eventPublisher.publishEvent(
                    new MuleFlaggedEvent(acid, "P1", riskScore, triggerReason, timestamp));

        } else if (riskScore >= config.getP2Score() && !state.hasEmittedP2) {
            state.hasEmittedP2 = true;
            alertsEmitted.incrementAndGet();
            log.info("⚠️ P2 ALERT: account={} score={} reason={}", acid, riskScore, triggerReason);
            eventPublisher.publishEvent(
                    new MuleFlaggedEvent(acid, "P2", riskScore, triggerReason, timestamp));
        }
    }

    private String describeTrigger(double zScore, int negStreak, int debitsInWindow, boolean ageRisk) {
        StringBuilder sb = new StringBuilder();
        if (Math.abs(zScore) > config.getZScore())
            sb.append("Z_SCORE_ANOMALY(").append(String.format("%.2f", zScore)).append(") ");
        if (negStreak >= config.getNegativeStreak())
            sb.append("NEGATIVE_BALANCE_STREAK(").append(negStreak).append(") ");
        if (debitsInWindow > config.getVelocityCount())
            sb.append("HIGH_VELOCITY(").append(debitsInWindow).append("/").append(config.getVelocityWindowSeconds()).append("s) ");
        if (ageRisk)
            sb.append("NEW_ACCOUNT_RISK ");
        return sb.toString().trim();
    }

    // ═════════════════════════════════════════════════════════════════
    //  DIAGNOSTIC VIEW (returned by /api/detection/account/{acid})
    // ═════════════════════════════════════════════════════════════════

    public record AccountStateView(
            long txnCount,
            double runningMean,
            double stdDev,
            double lastBalance,
            int negativeBalanceStreak,
            long accountAgeDays,
            boolean ageRiskFlag,
            boolean hasEmittedP1,
            boolean hasEmittedP2
    ) {}
}
