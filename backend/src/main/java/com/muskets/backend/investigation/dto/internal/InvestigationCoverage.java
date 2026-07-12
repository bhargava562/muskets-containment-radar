package com.muskets.backend.investigation.dto.internal;

import java.util.List;

/**
 * Statistics and tracking fields for the progress of the investigation.
 */
public record InvestigationCoverage(
    int totalNodes,
    int reviewedNodes,
    List<String> unreviewedNodeIds,
    List<String> expandableNodeIds
) {}
