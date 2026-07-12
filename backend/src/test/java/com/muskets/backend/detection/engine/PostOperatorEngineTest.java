package com.muskets.backend.detection.engine;

import com.muskets.backend.detection.model.MuleNetworkGraph;
import com.muskets.backend.detection.model.TransactionEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the Post-Operator Engine (Job 2).
 *
 * <p>Pure unit test — no Spring context, no database.</p>
 */
class PostOperatorEngineTest {

    private PostOperatorEngine engine;

    @BeforeEach
    void setUp() {
        engine = new PostOperatorEngine();
    }

    @Test
    @DisplayName("No counterparty data → single-node graph, no edges")
    void emptyGraphWithoutCounterpartyData() {
        MuleNetworkGraph graph = engine.traceConnectedAccounts("ACCOUNT_A", System.currentTimeMillis());

        assertEquals("ACCOUNT_A", graph.getStartingAccountId());
        assertEquals(1, graph.getVisitedAccounts().size());
        assertTrue(graph.getEdges().isEmpty());
    }

    @Test
    @DisplayName("Linear chain A→B→C→D→E (4 hops) → BFS visits all 5")
    void bfsTraversesLinearChain() {
        long now = System.currentTimeMillis();

        // A → B
        recordTxn("A", "B", 10000, now - 1000);
        // B → C
        recordTxn("B", "C", 8000, now - 900);
        // C → D
        recordTxn("C", "D", 6000, now - 800);
        // D → E
        recordTxn("D", "E", 4000, now - 700);

        MuleNetworkGraph graph = engine.traceConnectedAccounts("A", now);

        assertEquals(5, graph.getVisitedAccounts().size());
        assertTrue(graph.getVisitedAccounts().contains("A"));
        assertTrue(graph.getVisitedAccounts().contains("E"));
        assertFalse(graph.getEdges().isEmpty());
    }

    @Test
    @DisplayName("BFS stops at MAX_HOPS=4 — 5th hop not traversed")
    void bfsRespectsHopLimit() {
        long now = System.currentTimeMillis();

        // Chain: A → B → C → D → E → F (5 hops — F should NOT be visited)
        recordTxn("A", "B", 10000, now - 1000);
        recordTxn("B", "C", 8000, now - 900);
        recordTxn("C", "D", 6000, now - 800);
        recordTxn("D", "E", 4000, now - 700);
        recordTxn("E", "F", 2000, now - 600);

        MuleNetworkGraph graph = engine.traceConnectedAccounts("A", now);

        // A(0) → B(1) → C(2) → D(3) → E(4) → F would be hop 5, so F is excluded
        assertTrue(graph.getVisitedAccounts().contains("E"));
        assertFalse(graph.getVisitedAccounts().contains("F"),
                "F should not be visited — it's at hop 5, beyond MAX_HOPS=4");
    }

    @Test
    @DisplayName("Time window: old transactions (>48h) excluded")
    void timeWindowExcludesOldTransactions() {
        long now = System.currentTimeMillis();
        long threeAgo = now - (72L * 60 * 60 * 1000); // 72 hours ago

        // Old transaction — outside 48-hour window
        recordTxn("A", "B", 10000, threeAgo);
        // Recent transaction — inside window
        recordTxn("A", "C", 5000, now - 1000);

        MuleNetworkGraph graph = engine.traceConnectedAccounts("A", now);

        assertTrue(graph.getVisitedAccounts().contains("C"), "Recent connection should be found");
        // B might be visited (since it's indexed), but the edge from A→B should be
        // excluded by the time window filter
        long edgesToB = graph.getEdges().stream()
                .filter(e -> "B".equals(e.toAccount()))
                .count();
        assertEquals(0, edgesToB, "Old transaction edge should be excluded by time window");
    }

    @Test
    @DisplayName("Fan-out pattern: A sends to B, C, D simultaneously")
    void fanOutPattern() {
        long now = System.currentTimeMillis();

        recordTxn("A", "B", 10000, now - 100);
        recordTxn("A", "C", 8000, now - 90);
        recordTxn("A", "D", 6000, now - 80);

        MuleNetworkGraph graph = engine.traceConnectedAccounts("A", now);

        assertEquals(4, graph.getVisitedAccounts().size());
        assertTrue(graph.getEdges().size() >= 3);
    }

    // ── Helper ───────────────────────────────────────────────────────

    private void recordTxn(String from, String to, double amount, long timestamp) {
        TransactionEvent txn = new TransactionEvent();
        txn.setAcid(from);
        txn.setCounterpartyAcid(to);
        txn.setAmount(amount);
        txn.setTimestampMillis(timestamp);
        txn.setPartTranType("D"); // debit from source
        txn.setChannel("NEFT");
        engine.recordTransaction(txn);
    }
}
