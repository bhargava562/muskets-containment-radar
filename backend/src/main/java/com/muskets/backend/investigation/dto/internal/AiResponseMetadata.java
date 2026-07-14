package com.muskets.backend.investigation.dto.internal;

/**
 * Tracks performance and provider telemetry for AI responses.
 */
public record AiResponseMetadata(
    boolean live,
    String provider,
    String model,
    long latencyMs,
    String generatedAt
) {}
