package com.muskets.backend.investigation.dto.internal;

import java.util.List;

/**
 * Historical record of an AI analysis update.
 */
public record AiRevision(
    int contextVersion,
    String timestamp,        // ISO-8601
    String focusNodeId,
    String officerComment,
    List<AiSchemaContract> revisions
) {}
