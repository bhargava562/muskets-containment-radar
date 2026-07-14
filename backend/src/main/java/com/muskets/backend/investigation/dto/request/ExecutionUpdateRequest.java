package com.muskets.backend.investigation.dto.request;

public record ExecutionUpdateRequest(
    String action,
    String note
) {}
