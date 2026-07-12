package com.muskets.backend.investigation.dto.request;

/**
 * Request payload to update per-node review verdict status.
 */
public record NodeReviewStatusUpdateRequest(
    String officerVerdict
) {}
