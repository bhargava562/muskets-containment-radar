package com.muskets.backend.investigation.dto.internal;

/**
 * Represents a key event in the investigation timeline.
 */
public record TimelineEntry(
    String eventId,
    String timestamp,       // ISO-8601
    String title,
    String description,
    String category,        // e.g. "SYSTEM_ALERT", "OFFICER_REVIEW", "AI_REANALYSIS", "EVIDENCE_UPLOAD"
    String actor            // "System", "AI Copilot", "AML Officer", "Legal Officer"
) {}
