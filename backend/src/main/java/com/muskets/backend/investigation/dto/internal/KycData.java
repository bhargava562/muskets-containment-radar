package com.muskets.backend.investigation.dto.internal;

/**
 * KYC (Know Your Customer) data for an investigation node.
 */
public record KycData(
    String customerName,
    String idType,           // e.g., "AADHAAR", "PAN", "PASSPORT"
    String idNumber,         // masked for AI payload
    String dateOfBirth,
    String address,
    String kycStatus,        // "VERIFIED", "PENDING", "EXPIRED", "REJECTED"
    String lastVerifiedDate,
    String riskCategory,     // "LOW", "MEDIUM", "HIGH"
    String mobile,           // masked mobile number, e.g., "98XXXX4210"
    String occupation,       // e.g., "Delivery Executive", "Homemaker"
    String customerSince     // year string, e.g., "2022"
) {}
