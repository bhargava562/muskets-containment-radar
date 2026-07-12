package com.muskets.backend.investigation.dto.request;

/**
 * Request payload to proceed/escalate the case.
 */
public record ProceedRequest(
    String officerId
) {}
