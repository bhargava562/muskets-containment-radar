package com.muskets.backend.investigation.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

/**
 * Server-side workflow state machine.
 *
 * <p>Enforces strict transition guards matching the frontend's valid routes,
 * ensuring backend authority for all case statuses.</p>
 */
@Service
public class InvestigationStatusMachine {

    private static final Map<String, Set<String>> VALID_TRANSITIONS = Map.of(
        "PENDING_TRIAGE", Set.of("UNDER_INVESTIGATION", "CLOSED_FALSE_POSITIVE"),
        "UNDER_INVESTIGATION", Set.of("AWAITING_LEGAL_REVIEW", "CLOSED_FALSE_POSITIVE"),
        "AWAITING_LEGAL_REVIEW", Set.of("RESTRICTION_ACTIVE", "RETURNED_TO_AML", "CLOSED_FALSE_POSITIVE"),
        "RETURNED_TO_AML", Set.of("AWAITING_LEGAL_REVIEW", "CLOSED_FALSE_POSITIVE"),
        "RESTRICTION_ACTIVE", Set.of("RESOLVED"),
        "CLOSED_FALSE_POSITIVE", Set.of(),
        "RESOLVED", Set.of()
    );

    /**
     * Checks if a transition from current status to target status is permitted.
     *
     * @param currentStatus the current case status
     * @param targetStatus  the target status
     * @return true if permitted, false otherwise
     */
    public boolean isValidTransition(String currentStatus, String targetStatus) {
        if (currentStatus == null || targetStatus == null) {
            return false;
        }

        Set<String> allowed = VALID_TRANSITIONS.get(currentStatus);
        if (allowed == null) {
            return false;
        }

        return allowed.contains(targetStatus);
    }
}
