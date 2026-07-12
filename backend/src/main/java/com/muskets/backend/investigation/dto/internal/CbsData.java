package com.muskets.backend.investigation.dto.internal;

/**
 * CBS (Core Banking System) summary for an investigation node.
 */
public record CbsData(
    String accountNumber,     // masked for AI payload
    String ifscCode,          // masked for AI payload
    String accountType,       // "SAVINGS", "CURRENT", "SALARY"
    String branchName,
    double currentBalance,
    double averageMonthlyBalance,
    String accountOpenDate,
    int totalTransactionsLast30Days,
    double totalDebitLast30Days,
    double totalCreditLast30Days,
    String accountStatus      // "ACTIVE", "DORMANT", "FROZEN", "CLOSED"
) {}
