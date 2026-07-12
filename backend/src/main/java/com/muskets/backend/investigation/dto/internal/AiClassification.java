package com.muskets.backend.investigation.dto.internal;

/**
 * Enumerates the AI's classification of a node's role in the network.
 *
 * <p>These values are the only ones accepted from the LLM response.
 * {@code AiOrchestrationService.validateOrThrow()} rejects any
 * classification string not in this enum.</p>
 */
public enum AiClassification {
    CONFIRMED_VICTIM,
    SUSPECTED_MULE,
    UNDER_REVIEW,
    LIKELY_INNOCENT,
    CLEARED
}
