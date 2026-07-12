package com.muskets.backend.investigation.dto.internal;

/**
 * Case snapshot loaded on case start, before graph is built.
 */
public record CaseSnapshot(
    String caseId,
    String accountId,
    String customerName,
    String priority,          // "P1", "P2", "P3"
    double riskAmount,
    double tracedAmount,
    double totalBalance,
    String triggerReason,
    String generatedAt,
    String status
) {}
