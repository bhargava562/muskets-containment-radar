package com.muskets.backend.investigation.dto.internal;

/**
 * Complaint data linked to an investigation node.
 *
 * <p>Represents a complaint (cyber crime, fraud report) filed against
 * or involving this account, sourced from external complaint databases
 * such as the 1930 Portal or branch-level FIR records.</p>
 */
public record ComplaintData(
    String complaintId,       // e.g., "CYB2392"
    String victimName,        // name of the complainant
    String crimeType,         // "UPI_FRAUD", "PHISHING", "IDENTITY_THEFT"
    double reportedAmount,    // amount reported in the complaint
    String registeredAt,      // "1930 Portal", "Branch", "Email"
    boolean firLinked         // whether a police FIR is linked
) {}
