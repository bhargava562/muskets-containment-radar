package com.muskets.backend.investigation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.muskets.backend.investigation.InvestigationConfig;
import com.muskets.backend.investigation.ai.AiClient;
import com.muskets.backend.investigation.ai.AiPromptBuilder;
import com.muskets.backend.investigation.dto.internal.*;
import com.muskets.backend.investigation.store.InvestigationContextStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class AiOrchestrationServiceTest {

    private AiOrchestrationService orchestrationService;
    private InvestigationContext context;

    @BeforeEach
    public void setUp() {
        InvestigationContextStore store = new InvestigationContextStore();
        AiClient mockClient = (sys, usr) -> "[]";
        ObjectMapper mapper = new ObjectMapper();
        AiPromptBuilder promptBuilder = new AiPromptBuilder(mapper);
        InvestigationConfig config = new InvestigationConfig();

        this.orchestrationService = new AiOrchestrationService(store, mockClient, promptBuilder, mapper, config);

        // Seed context with test node M1
        this.context = new InvestigationContext();
        this.context.setCaseId("CASE-TEST-001");
        InvestigationNode node = new InvestigationNode();
        node.setNodeId("M1");
        node.setNodeType("MULE");
        context.getNodes().add(node);
    }

    @Test
    @SuppressWarnings("unchecked")
    public void testValidateOrThrow_WithRootJsonObjectNodesArray() throws Exception {
        String json = """
            {
              "nodes": [
                {
                  "nodeId": "M1",
                  "aiClassification": "SUSPECTED_MULE",
                  "confidence": 0.95,
                  "evidence": [
                    {
                      "source": "TRANSACTION_PATTERN",
                      "derivedFrom": "High velocity layering burst",
                      "weight": 0.9
                    }
                  ],
                  "recommendedAction": "FULL_FREEZE"
                }
              ]
            }
            """;

        Method method = AiOrchestrationService.class.getDeclaredMethod("validateOrThrow", String.class, InvestigationContext.class);
        method.setAccessible(true);

        List<AiSchemaContract> contracts = (List<AiSchemaContract>) method.invoke(orchestrationService, json, context);
        assertNotNull(contracts);
        assertEquals(1, contracts.size());
        assertEquals("M1", contracts.get(0).nodeId());
        assertEquals("SUSPECTED_MULE", contracts.get(0).aiClassification());
        assertEquals(0.95, contracts.get(0).confidence());
    }

    @Test
    @SuppressWarnings("unchecked")
    public void testValidateOrThrow_WithRootJsonArray() throws Exception {
        String json = """
            [
              {
                "nodeId": "M1",
                "aiClassification": "CLEARED",
                "confidence": 0.88,
                "evidence": [
                  {
                    "source": "OFFICER_CHALLENGE",
                    "derivedFrom": "Verified salary link",
                    "weight": 0.95
                  }
                ],
                "recommendedAction": "NO_ACTION"
              }
            ]
            """;

        Method method = AiOrchestrationService.class.getDeclaredMethod("validateOrThrow", String.class, InvestigationContext.class);
        method.setAccessible(true);

        List<AiSchemaContract> contracts = (List<AiSchemaContract>) method.invoke(orchestrationService, json, context);
        assertNotNull(contracts);
        assertEquals(1, contracts.size());
        assertEquals("M1", contracts.get(0).nodeId());
        assertEquals("CLEARED", contracts.get(0).aiClassification());
    }

    @Test
    public void testHiddenNodePromotionOnAiReanalysis() throws Exception {
        // Setup M2 node in active context and hidden preview node M3 in expandPreview
        InvestigationNode m2 = new InvestigationNode();
        m2.setNodeId("M2");
        m2.setNodeType("MULE");
        context.getNodes().add(m2);

        InvestigationNode m3 = new InvestigationNode();
        m3.setNodeId("M3");
        m3.setNodeType("MULE");
        ExpandPreview preview = new ExpandPreview(List.of(m3), List.of(new GraphEdge("M2", "M3", 90000.0, 1783858740000L, "UPI")));
        context.setExpandPreview(preview);

        AiSchemaContract revision = new AiSchemaContract(
            "M3",
            "SUSPECTED_MULE",
            0.89,
            List.of(new EvidenceClaim("EV-M3", "TRANSACTION_PATTERN", "Layered transfer to unlisted counterparty Deshmukh", 0.92, "TXN87321009")),
            "FULL_FREEZE"
        );

        context.applyAiRevision(List.of(revision), "M2", "Trace incomplete, include hidden mule Sanjay Deshmukh", "2026-07-27T10:00:00Z");

        // Verify M3 (and connected preview node MR2) were promoted into active graph nodes
        assertTrue(context.getNodes().size() >= 2);
        assertTrue(context.getNodes().stream().anyMatch(n -> n.getNodeId().equals("M3")));
        assertEquals(AiClassification.SUSPECTED_MULE, context.getNodes().stream().filter(n -> n.getNodeId().equals("M3")).findFirst().get().getAiAnalysis().aiClassification());
        assertTrue(context.getEdges().stream().anyMatch(e -> e.fromNodeId().equals("M2") && e.toNodeId().equals("M3")));
    }
}
