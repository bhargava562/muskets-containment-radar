package com.muskets.backend.investigation.dto.internal;

/**
 * Case-level recommendation chosen by the officer before escalation.
 */
public record OfficerRecommendation(
    String selectedAction,   // NO_ACTION, MONITOR, BRANCH_VERIFICATION, PARTIAL_LIEN, ESCALATE
    String rationale,
    String timestamp,        // ISO-8601
    String officerId
) {}
