package com.muskets.backend.investigation.dto.internal;

import java.util.List;

/**
 * Strict schema contract for what the AI MUST return per node.
 *
 * <p>{@code AiOrchestrationService.validateOrThrow()} enforces that:
 * <ul>
 *   <li>{@code nodeId} is a known node in the investigation</li>
 *   <li>{@code aiClassification} is one of the 5 allowed enum values</li>
 *   <li>{@code confidence} is in [0.0, 1.0]</li>
 * </ul>
 * Any violation causes the entire AI response to be rejected (HTTP 502).
 * </p>
 */
public record AiSchemaContract(
    String nodeId,
    String aiClassification,    // validated against AiClassification enum
    double confidence,
    List<EvidenceClaim> evidence,
    String recommendedAction
) {}
