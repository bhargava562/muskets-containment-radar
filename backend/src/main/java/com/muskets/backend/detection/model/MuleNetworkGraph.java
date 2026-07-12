package com.muskets.backend.detection.model;

import java.util.List;

/**
 * Output shape of the Post-Operator Engine (Job 2) — a bounded subgraph
 * of connected accounts traced from a flagged starting point.
 *
 * <p>This is the data structure that feeds the Investigation Workspace's
 * Network tab (react-force-graph-2d on the frontend).</p>
 */
public class MuleNetworkGraph {

    private final String startingAccountId;
    private final List<String> visitedAccounts;
    private final List<GraphEdge> edges;

    public MuleNetworkGraph(String startingAccountId, List<String> visitedAccounts, List<GraphEdge> edges) {
        this.startingAccountId = startingAccountId;
        this.visitedAccounts = visitedAccounts;
        this.edges = edges;
    }

    public String getStartingAccountId()    { return startingAccountId; }
    public List<String> getVisitedAccounts(){ return visitedAccounts; }
    public List<GraphEdge> getEdges()       { return edges; }

    /**
     * One directed edge in the mule network graph — a fund transfer
     * from one account to another.
     */
    public record GraphEdge(
            String fromAccount,
            String toAccount,
            double amount,
            long timestamp
    ) {}
}
