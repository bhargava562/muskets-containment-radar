package com.muskets.backend.investigation.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.muskets.backend.investigation.dto.internal.CaseNote;
import com.muskets.backend.investigation.dto.internal.CbsData;
import com.muskets.backend.investigation.dto.internal.InvestigationContext;
import com.muskets.backend.investigation.dto.internal.InvestigationNode;
import com.muskets.backend.investigation.dto.internal.KycData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class AiPromptBuilderTest {

    private AiPromptBuilder promptBuilder;
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setUp() {
        this.objectMapper = new ObjectMapper();
        this.promptBuilder = new AiPromptBuilder(objectMapper);
    }

    @Test
    public void testMaskPiiHelper() {
        // Test Account Number Masking
        assertEquals("1855XXXXXX12847", promptBuilder.maskPii("185501000012847"));

        // Test IFSC Code Masking
        assertEquals("IOBAXXXX855", promptBuilder.maskPii("IOBA0001855"));

        // Test PAN Card ID Masking
        assertEquals("XXXXX1234F", promptBuilder.maskPii("ABCDE1234F"));

        // Test Name Masking
        assertEquals("S***l K***r", promptBuilder.maskPii("Sunil Kumar"));
    }

    @Test
    public void testUserPromptPiiExclusionAndMasking() {
        InvestigationContext context = new InvestigationContext();
        context.setCaseId("case-FRA-2026-IOB-00847");

        InvestigationNode node = new InvestigationNode();
        node.setNodeId("M1");
        node.setAccountId("185502000087321");
        node.setLabel("M1 — Sunil Kumar");

        KycData kyc = new KycData(
            "Sunil Kumar", "PAN", "ABCDE1234F", "14/08/1982",
            "Vashi, Navi Mumbai", "VERIFIED", "2026-01-01", "HIGH"
        );
        node.setKyc(kyc);

        CbsData cbs = new CbsData(
            "185502000087321", "IOBA0001855", "SAVINGS", "Vashi",
            50000.0, 1000.0, "2025-01-01", 12, 10000.0, 15000.0, "ACTIVE"
        );
        node.setCbs(cbs);

        context.setNodes(List.of(node));

        // Add a case note containing sensitive notes
        context.appendCaseNote("EMP-902", "Customer Sunil Kumar contacted branch on 12-Jul. Secret note content.", "2026-07-12T10:15:00Z");

        String promptOutput = promptBuilder.buildUserPrompt(context, "M1", "Officer verification comment");

        // 1. Assert PII Masked consistently in prompt payload
        assertFalse(promptOutput.contains("185502000087321"), "Should not leak unmasked account number");
        assertFalse(promptOutput.contains("IOBA0001855"), "Should not leak unmasked IFSC code");
        assertFalse(promptOutput.contains("ABCDE1234F"), "Should not leak unmasked PAN card ID");
        assertFalse(promptOutput.contains("Sunil Kumar"), "Should not leak unmasked customer name");

        assertTrue(promptOutput.contains("1855XXXXXX87321"), "Should contain masked account number");
        assertTrue(promptOutput.contains("IOBAXXXX855"), "Should contain masked IFSC code");
        assertTrue(promptOutput.contains("XXXXX1234F"), "Should contain masked PAN Card ID");
        assertTrue(promptOutput.contains("S***l K***r"), "Should contain masked customer name");

        // 2. Assert Case notes completely EXCLUDED from Prompt payload (Trade-off register requirement)
        assertFalse(promptOutput.contains("Secret note content."), "Case notes log must be excluded from AI payload");
    }
}
