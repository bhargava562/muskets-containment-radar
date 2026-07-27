package com.muskets.backend.investigation.dto.internal;

import java.util.List;

/**
 * Pre-computed preview nodes and edges for scope expansion.
 */
public record ExpandPreview(
    List<InvestigationNode> nodes,
    List<GraphEdge> edges
) {}
