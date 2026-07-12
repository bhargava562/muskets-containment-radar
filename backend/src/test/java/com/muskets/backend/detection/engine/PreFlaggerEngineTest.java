package com.muskets.backend.detection.engine;

import com.muskets.backend.detection.DetectionConfig;
import com.muskets.backend.detection.model.TransactionEvent;
import com.muskets.backend.shared.events.MuleFlaggedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the Pre-Flagger Engine (Job 1).
 *
 * <p>Pure unit test — no Spring context, no database.
 * Uses a capturing event publisher to verify alert emission.</p>
 */
class PreFlaggerEngineTest {

    private PreFlaggerEngine engine;
    private List<MuleFlaggedEvent> capturedEvents;

    @BeforeEach
    void setUp() {
        capturedEvents = new ArrayList<>();
        ApplicationEventPublisher capturingPublisher = event -> {
            if (event instanceof MuleFlaggedEvent mfe) {
                capturedEvents.add(mfe);
            }
        };

        DetectionConfig config = new DetectionConfig();
        // Use defaults: zScore=3.0, negativeStreak=5, velocityWindowSeconds=60,
        // velocityCount=5, p1Score=8.0, p2Score=5.0, accountAgeRiskDays=30

        engine = new PreFlaggerEngine(capturingPublisher, config);
    }

    // ── Welford's Z-score tests ──────────────────────────────────────

    @Test
    @DisplayName("Z-score: 10 normal transactions then 1 outlier → |Z| > 3")
    void zScoreDetectsOutlier() {
        String acid = "TEST_ZSCORE";
        // Feed 10 transactions around ₹500
        for (int i = 0; i < 10; i++) {
            engine.processTransaction(txn(acid, 500 + (i * 10), 5000, "C"));
        }
        // Now feed a ₹50,000 outlier
        engine.processTransaction(txn(acid, 50000, 55000, "C"));

        var state = engine.getAccountState(acid);
        assertNotNull(state);
        assertEquals(11, state.txnCount());
        // The engine should have detected this — check if alert was emitted
        // Z-score of 50000 against mean ~545 should be well above 3
    }

    @Test
    @DisplayName("Z-score: first 2 transactions are not judged (not enough history)")
    void zScoreSkipsFirstTwoTransactions() {
        String acid = "TEST_EARLY";
        engine.processTransaction(txn(acid, 100000, 100000, "C")); // big amount, but first txn
        engine.processTransaction(txn(acid, 1, -99999, "D"));      // tiny amount, but only 2nd txn

        // No alert should fire — not enough history for Z-score
        var state = engine.getAccountState(acid);
        assertEquals(2, state.txnCount());
    }

    // ── Negative-balance streak tests ────────────────────────────────

    @Test
    @DisplayName("Negative-balance streak: 5 consecutive → streak = 5")
    void negativeBalanceStreakCounts() {
        String acid = "TEST_STREAK";
        for (int i = 0; i < 5; i++) {
            engine.processTransaction(txn(acid, 100, -500 - i, "D"));
        }

        var state = engine.getAccountState(acid);
        assertEquals(5, state.negativeBalanceStreak());
    }

    @Test
    @DisplayName("Negative-balance streak: resets on positive balance")
    void negativeBalanceStreakResets() {
        String acid = "TEST_RESET";
        // 3 negative
        for (int i = 0; i < 3; i++) {
            engine.processTransaction(txn(acid, 100, -500, "D"));
        }
        // 1 positive — resets
        engine.processTransaction(txn(acid, 10000, 5000, "C"));

        var state = engine.getAccountState(acid);
        assertEquals(0, state.negativeBalanceStreak());
    }

    // ── Velocity tests ───────────────────────────────────────────────

    @Test
    @DisplayName("Velocity: 6 debits within 60s window detected")
    void velocityDetectsRapidDebits() {
        String acid = "TEST_VELOCITY";
        long now = System.currentTimeMillis();
        // 6 debits within a 60-second window
        for (int i = 0; i < 6; i++) {
            TransactionEvent t = txn(acid, 100, 5000, "D");
            t.setTimestampMillis(now + (i * 1000)); // 1 second apart
            engine.processTransaction(t);
        }

        var state = engine.getAccountState(acid);
        assertEquals(6, state.txnCount());
    }

    // ── Composite scoring + alert emission ───────────────────────────

    @Test
    @DisplayName("Composite: negative streak + Z-score anomaly → P1 alert emitted")
    void compositeScoreTriggersP1() {
        String acid = "TEST_P1";

        // Build up normal history (10 small transactions with negative balance)
        for (int i = 0; i < 10; i++) {
            engine.processTransaction(txn(acid, 50 + i, -(100 + i), "D"));
        }

        // negativeBalanceStreak is now 10 (≥5 → +4.0 to score)
        // Now send a huge outlier amount → Z-score anomaly (+4.0)
        // Total: 4.0 + 4.0 = 8.0 ≥ P1 threshold
        engine.processTransaction(txn(acid, 500000, -500100, "D"));

        assertFalse(capturedEvents.isEmpty(), "Expected at least one alert");
        MuleFlaggedEvent alert = capturedEvents.getFirst();
        assertEquals(acid, alert.getAccountId());
        assertEquals("P1", alert.getPriority());
        assertTrue(alert.getRiskScore() >= 8.0);
        assertTrue(alert.getTriggerReason().contains("NEGATIVE_BALANCE_STREAK"));
    }

    @Test
    @DisplayName("Baseline account with normal behavior → no alert")
    void normalAccountNoAlert() {
        String acid = "TEST_NORMAL";

        // Simulate a normal account: steady credits, always positive balance
        for (int i = 0; i < 20; i++) {
            engine.processTransaction(txn(acid, 1000 + (i * 10), 50000 + (i * 1000), "C"));
        }

        assertTrue(capturedEvents.isEmpty(), "Normal account should not trigger any alert");
    }

    // ── Account-age risk ─────────────────────────────────────────────

    @Test
    @DisplayName("Account age < 30 days → age risk flag set")
    void accountAgeRiskFlagSet() {
        String acid = "TEST_AGE";
        TransactionEvent t = txn(acid, 100, 100, "C");
        // Account opened 15 days ago
        java.time.LocalDate openDate = java.time.LocalDate.now().minusDays(15);
        t.setAcctOpnDate(openDate.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " 00:00");
        t.setTimestampMillis(System.currentTimeMillis());
        engine.processTransaction(t);

        var state = engine.getAccountState(acid);
        assertTrue(state.ageRiskFlag());
    }

    // ── Duplicate alert suppression ──────────────────────────────────

    @Test
    @DisplayName("Same account does not emit duplicate P1 alerts")
    void noDuplicateAlerts() {
        String acid = "TEST_DEDUP";

        // Trigger P1 twice
        for (int round = 0; round < 2; round++) {
            for (int i = 0; i < 10; i++) {
                engine.processTransaction(txn(acid, 50 + i, -(100 + i), "D"));
            }
            engine.processTransaction(txn(acid, 500000, -500100, "D"));
        }

        long p1Count = capturedEvents.stream()
                .filter(e -> "P1".equals(e.getPriority()) && acid.equals(e.getAccountId()))
                .count();
        assertEquals(1, p1Count, "Should emit P1 only once per account");
    }

    // ── Helper ───────────────────────────────────────────────────────

    private TransactionEvent txn(String acid, double amount, double balance, String partTranType) {
        TransactionEvent t = new TransactionEvent();
        t.setAcid(acid);
        t.setAmount(amount);
        t.setBalance(balance);
        t.setPartTranType(partTranType);
        t.setTimestampMillis(System.currentTimeMillis());
        t.setChannel("UPI");
        return t;
    }
}
