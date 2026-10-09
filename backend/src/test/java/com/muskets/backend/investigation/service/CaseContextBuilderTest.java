package com.muskets.backend.investigation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.muskets.backend.investigation.dto.internal.InvestigationContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class CaseContextBuilderTest {

    private CaseContextBuilder builder;

    @BeforeEach
    void setUp() {
        builder = new CaseContextBuilder(new ObjectMapper(), new DefaultResourceLoader());
    }

    @Test
    @DisplayName("Should load exact seed for FRA-2026-IOB-00847")
    void shouldLoadExactSeedFor00847() {
        Optional<InvestigationContext> context = builder.loadSeedContext("FRA-2026-IOB-00847");
        assertTrue(context.isPresent());
        assertEquals("FRA-2026-IOB-00847", context.get().getCaseId());
        assertNotNull(context.get().getSnapshot());
    }

    @Test
    @DisplayName("Should load exact seed for FRA-2026-IOB-00923")
    void shouldLoadExactSeedFor00923() {
        Optional<InvestigationContext> context = builder.loadSeedContext("FRA-2026-IOB-00923");
        assertTrue(context.isPresent());
        assertEquals("FRA-2026-IOB-00923", context.get().getCaseId());
        assertEquals("Priya Venkatesh", context.get().getSnapshot().customerName());
        assertFalse(context.get().getNodes().isEmpty());
    }

    @Test
    @DisplayName("Should fall back to default template for unseeded case ID without failing")
    void shouldFallbackForUnknownCaseId() {
        Optional<InvestigationContext> context = builder.loadSeedContext("FRA-2026-IOB-99999");
        assertTrue(context.isPresent());
        assertEquals("FRA-2026-IOB-99999", context.get().getCaseId());
        assertEquals("FRA-2026-IOB-99999", context.get().getSnapshot().caseId());
    }
}
