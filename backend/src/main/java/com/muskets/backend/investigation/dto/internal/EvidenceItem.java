package com.muskets.backend.investigation.dto.internal;

/**
 * Metadata for a file uploaded to the evidence repository.
 */
public record EvidenceItem(
    String evidenceId,
    String fileName,
    String uploadedBy,
    String uploadedAt,       // ISO-8601
    long fileSize
) {}
