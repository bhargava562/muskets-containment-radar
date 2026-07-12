package com.muskets.backend.investigation.dto.request;

/**
 * Request payload to trigger AI reanalysis.
 */
public record ReanalyzeRequest(
    String focusNodeId,
    String officerComment
) {}
