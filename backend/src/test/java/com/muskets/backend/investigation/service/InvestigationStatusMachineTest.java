package com.muskets.backend.investigation.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class InvestigationStatusMachineTest {

    private InvestigationStatusMachine statusMachine;

    @BeforeEach
    public void setUp() {
        this.statusMachine = new InvestigationStatusMachine();
    }

    @Test
    public void testValidTransitions() {
        // Assert initial triage transitions
        assertTrue(statusMachine.isValidTransition("PENDING_TRIAGE", "UNDER_INVESTIGATION"));
        assertTrue(statusMachine.isValidTransition("PENDING_TRIAGE", "CLOSED_FALSE_POSITIVE"));

        // Assert escalation transitions
        assertTrue(statusMachine.isValidTransition("UNDER_INVESTIGATION", "AWAITING_LEGAL_REVIEW"));
        assertTrue(statusMachine.isValidTransition("AWAITING_LEGAL_REVIEW", "RETURNED_TO_AML"));
        assertTrue(statusMachine.isValidTransition("RETURNED_TO_AML", "AWAITING_LEGAL_REVIEW"));
    }

    @Test
    public void testInvalidTransitions() {
        // Direct jump from triage to resolved
        assertFalse(statusMachine.isValidTransition("PENDING_TRIAGE", "RESOLVED"));

        // Out of order transition
        assertFalse(statusMachine.isValidTransition("UNDER_INVESTIGATION", "RESOLVED"));

        // Transitions out of terminal states
        assertFalse(statusMachine.isValidTransition("CLOSED_FALSE_POSITIVE", "UNDER_INVESTIGATION"));
        assertFalse(statusMachine.isValidTransition("RESOLVED", "AWAITING_LEGAL_REVIEW"));
    }
}
