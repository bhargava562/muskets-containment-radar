package com.muskets.backend.investigation.dto.internal;

import java.util.List;

/**
 * Evidence claim made by the AI about a node.
 *
 * <p>Each claim includes a source reference and what it was derived from,
 * providing provenance for the AI's reasoning. The {@code evidenceId}
 * and {@code linkedRecordId} fields enable click-through from the AI's
 * claim to the actual source record (e.g., a specific transaction or
 * KYC field), making the AI explainable rather than a black box.</p>
 */
public record EvidenceClaim(
    String evidenceId,       // unique evidence identifier, e.g., "EV-12"
    String source,           // e.g., "CBS_RECORD", "KYC_VERIFICATION", "TRANSACTION_PATTERN"
    String derivedFrom,      // e.g., "High-velocity debits detected in 48h window"
    double weight,           // [0.0, 1.0] — how much this evidence contributes
    String linkedRecordId    // points to a specific txnId / KYC field / CBS field
) {}
