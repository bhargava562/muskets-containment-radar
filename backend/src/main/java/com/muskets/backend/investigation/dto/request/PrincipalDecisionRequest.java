package com.muskets.backend.investigation.dto.request;

public record PrincipalDecisionRequest(
    String decision,   // APPROVE | RETURN | REJECT | NEED_MORE_EVIDENCE
    String comment     // required for RETURN and NEED_MORE_EVIDENCE
) {}
