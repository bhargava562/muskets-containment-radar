package com.muskets.backend.investigation.dto.internal;

public record StrDraft(
    String narrative,
    String generatedAt,
    boolean officerEdited,
    String status          // DRAFT | APPROVED
) {}
