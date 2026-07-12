package com.muskets.backend.investigation.dto.internal;

/**
 * Summary of a transaction for display in node detail.
 */
public record TransactionSummary(
    String txnId,
    String fromAccount,
    String toAccount,
    double amount,
    String currency,
    String type,           // "UPI", "NEFT", "RTGS", "IMPS"
    String timestamp,
    String narration
) {}
