package com.muskets.backend.detection.engine;

import com.muskets.backend.detection.model.MuleNetworkGraph;
import com.muskets.backend.detection.model.MuleNetworkGraph.GraphEdge;
import com.muskets.backend.detection.model.TransactionEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Job 2 — The Post-Operator Engine.
 *
 * <p>Runs <b>only</b> when an investigator requests a graph trace on a
 * flagged account — not per transaction. It is allowed to take longer
 * than the pre-flagger because it runs once per investigation, not once
 * per transaction in the stream.</p>
 *
 * <h3>Algorithm: Bounded Breadth-First Search</h3>
 * <p>BFS gives "everyone at distance k" before going deeper, which lets
 * us cleanly cut off at {@code MAX_HOPS} without accidentally chasing one
 * deep branch while ignoring three shallow ones. Same shape as LeetCode's
 * "Rotting Oranges" / "Word Ladder" — level-order traversal with early
 * termination.</p>
 *
 * <h3>Data requirement</h3>
 * <p>This engine needs {@code counterpartyAcid} on transactions — which
 * the raw CSV does not have. When fed CSV-only data, it correctly returns
 * a single-node graph with no edges. That's the honest answer, not a bug.</p>
 */
@Component
public class PostOperatorEngine {

    private static final Logger log = LoggerFactory.getLogger(PostOperatorEngine.class);
    private static final int MAX_HOPS = 4;
    private static final long TIME_WINDOW_MILLIS = 48L * 60 * 60 * 1000; // 48 hours

    // In-memory store of transactions that have counterparty data.
    // Keyed by ACID → list of transactions involving that account.
    private final Map<String, List<TransactionEvent>> transactionIndex = new ConcurrentHashMap<>();

    /**
     * Record a transaction for later graph traversal.
     * Only stores transactions that have a non-null counterpartyAcid.
     */
    public void recordTransaction(TransactionEvent txn) {
        if (txn.getCounterpartyAcid() == null || txn.getCounterpartyAcid().isBlank()) {
            return; // no counterparty — cannot build graph edges from this
        }

        // Index under both the account and the counterparty for bidirectional lookup
        transactionIndex
                .computeIfAbsent(txn.getAcid(), k -> new CopyOnWriteArrayList<>())
                .add(txn);
        transactionIndex
                .computeIfAbsent(txn.getCounterpartyAcid(), k -> new CopyOnWriteArrayList<>())
                .add(txn);
    }

    /**
     * Trace connected accounts from a starting point using bounded BFS.
     *
     * @param startingAccountId the flagged account to trace from
     * @param asOfTimestamp      the reference timestamp (typically "now")
     * @return a {@link MuleNetworkGraph} containing visited accounts and edges
     */
    public MuleNetworkGraph traceConnectedAccounts(String startingAccountId, long asOfTimestamp) {
        Set<String> visited = new LinkedHashSet<>();
        Queue<String> toVisit = new LinkedList<>();
        Queue<Integer> hopCounts = new LinkedList<>();
        List<GraphEdge> edges = new ArrayList<>();

        toVisit.add(startingAccountId);
        hopCounts.add(0);
        visited.add(startingAccountId);

        long windowStart = asOfTimestamp - TIME_WINDOW_MILLIS;

        while (!toVisit.isEmpty()) {
            String currentAccount = toVisit.poll();
            int currentHop = hopCounts.poll();

            if (currentHop >= MAX_HOPS) continue; // stop going deeper

            List<TransactionEvent> relatedTxns = transactionIndex.getOrDefault(currentAccount, List.of());

            for (TransactionEvent txn : relatedTxns) {
                // Time-window filter
                if (txn.getTimestampMillis() < windowStart || txn.getTimestampMillis() > asOfTimestamp) {
                    continue;
                }

                String otherAccount = txn.getCounterpartyAcid();
                if (otherAccount == null || otherAccount.isBlank()) continue;

                // Determine edge direction
                String from = txn.isDebit() ? txn.getAcid() : otherAccount;
                String to = txn.isDebit() ? otherAccount : txn.getAcid();

                edges.add(new GraphEdge(from, to, txn.getAmount(), txn.getTimestampMillis()));

                if (!visited.contains(otherAccount)) {
                    visited.add(otherAccount);
                    toVisit.add(otherAccount);
                    hopCounts.add(currentHop + 1);
                }
            }
        }

        log.info("Graph trace from {} — visited {} accounts, {} edges, max {} hops",
                startingAccountId, visited.size(), edges.size(), MAX_HOPS);

        return new MuleNetworkGraph(startingAccountId, new ArrayList<>(visited), edges);
    }

    /** Reset all stored transactions — used for demo/testing. */
    public void reset() {
        transactionIndex.clear();
    }

    /** Diagnostic: how many accounts have indexed transactions. */
    public int getIndexedAccountCount() {
        return transactionIndex.size();
    }
}
