package com.muskets.backend.investigation.dto.internal;

import java.util.List;

/**
 * AI analysis for a specific node — what the LLM concluded.
 */
public record AiAnalysis(
    AiClassification aiClassification,
    double confidence,
    List<EvidenceClaim> evidence,
    String recommendedAction,
    String summary               // human-readable explanation from the AI
) {}
