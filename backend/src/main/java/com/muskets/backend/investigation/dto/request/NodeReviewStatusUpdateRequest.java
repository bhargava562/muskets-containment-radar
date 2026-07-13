package com.muskets.backend.investigation.dto.request;

/**
 * Request payload to update per-node review verdict status.
 *
 * <p>The {@code officerNote} is required when {@code officerVerdict}
 * is {@code DISPUTED} — enforced by the blocking UI pattern where
 * the textarea must be filled before the combined PATCH fires.</p>
 */
public record NodeReviewStatusUpdateRequest(
    String officerVerdict,
    String officerNote       // mandatory for DISPUTED, null for others
) {}
