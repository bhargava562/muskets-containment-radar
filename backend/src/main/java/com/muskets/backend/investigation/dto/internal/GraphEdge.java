package com.muskets.backend.investigation.dto.internal;

/**
 * Represents a transaction edge in the suspect graph.
 */
public record GraphEdge(
    String fromNodeId,
    String toNodeId,
    double amount,
    long timestampMillis,
    String type            // e.g. "UPI", "IMPS"
) {}
