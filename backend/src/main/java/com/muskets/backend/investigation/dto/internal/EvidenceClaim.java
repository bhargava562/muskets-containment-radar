package com.muskets.backend.investigation.dto.internal;

import java.util.List;

/**
 * Evidence claim made by the AI about a node.
 *
 * <p>Each claim includes a source reference and what it was derived from,
 * providing provenance for the AI's reasoning.</p>
 */
public record EvidenceClaim(
    String source,       // e.g., "CBS_RECORD", "KYC_VERIFICATION", "TRANSACTION_PATTERN"
    String derivedFrom,  // e.g., "High-velocity debits detected in 48h window"
    double weight        // [0.0, 1.0] — how much this evidence contributes
) {}
