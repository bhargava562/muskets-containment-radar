package com.muskets.backend.investigation.dto.request;

/**
 * Request payload to update per-node containment action recommendation.
 */
public record NodeActionUpdateRequest(
    String nodeAction
) {}
