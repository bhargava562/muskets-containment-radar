package com.muskets.backend.investigation.dto.internal;

public record ExecutionRecord(
    String recordId,
    String action,    // CUSTOMER_CONTACTED | CUSTOMER_VISITED | DOCUMENTS_SUBMITTED | RESTRICTION_APPLIED | UNABLE_TO_APPLY
    String note,
    String recordedBy,
    String timestamp
) {}
