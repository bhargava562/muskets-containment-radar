package com.muskets.backend.investigation.dto.request;

/**
 * Request payload to append a new case note.
 */
public record AddCaseNoteRequest(
    String content
) {}
