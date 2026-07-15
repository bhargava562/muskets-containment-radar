package com.muskets.backend.investigation.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Deterministic mock evaluator to simulate AI decisions offline or without API keys.
 */
@Component
public class MockAiEvaluator {

    private static final Logger log = LoggerFactory.getLogger(MockAiEvaluator.class);

    public String generateMockResponse(String userPrompt) {
        String lowerPrompt = userPrompt.toLowerCase();
        log.info("Simulating AI re-evaluation/initial scan for query: {}", userPrompt);

        // Scenario 0: STR Narrative generation check (specifically formatted plain text, not JSON context)
        if (userPrompt.contains("Case ID: ") && userPrompt.contains("Nodes in network:")) {
            String caseId = "Unknown Case";
            String customerName = "Unknown Customer";
            String riskAmount = "0";
            String tracedAmount = "0";
            String trigger = "Unspecified anomaly";

            for (String line : userPrompt.split("\n")) {
                line = line.trim();
                if (line.startsWith("Case ID: ")) {
                    caseId = line.substring("Case ID: ".length()).trim();
                } else if (line.startsWith("Customer: ")) {
                    customerName = line.substring("Customer: ".length()).trim();
                } else if (line.startsWith("Risk Amount: INR ")) {
                    riskAmount = line.substring("Risk Amount: INR ".length()).trim();
                } else if (line.startsWith("Traced Amount: INR ")) {
                    tracedAmount = line.substring("Traced Amount: INR ".length()).trim();
                } else if (line.startsWith("Trigger: ")) {
                    trigger = line.substring("Trigger: ".length()).trim();
                }
            }

            return String.format(
                "SUSPICIOUS TRANSACTION REPORT (STR) NARRATIVE\n" +
                "============================================\n" +
                "1. Case Reference:\n" +
                "   - Case ID: %s\n" +
                "   - Primary Subject: %s\n" +
                "   - Trigger Event: %s\n\n" +
                "2. Alert Ingestion & Analysis:\n" +
                "   - Ingress amount of INR %s was identified under alert rules.\n" +
                "   - Layering patterns indicate potential smurfing behavior with INR %s successfully traced across downstream hops.\n" +
                "   - Customer profile has been flagged for further verification against the reported transaction velocity.\n\n" +
                "3. Compliance Recommendations:\n" +
                "   - Primary subject %s has been recommended for a core banking system lien / restriction.\n" +
                "   - Proportional restrictions are applied to safeguard active merchant balances under PMLA Section 12AA.\n" +
                "   - Evidence package is compiled and hashed for formal FIU-IND filing.\n",
                caseId, customerName, trigger, riskAmount, tracedAmount, customerName
            );
        }

        // Scenario 1: Sunil/cleared/innocent keywords
        if (lowerPrompt.contains("cleared") || lowerPrompt.contains("innocent") || lowerPrompt.contains("sunil")) {
            return """
                [
                  {
                    "nodeId": "M1",
                    "aiClassification": "CLEARED",
                    "confidence": 0.92,
                    "evidence": [
                      {
                        "source": "OFFICER_CHALLENGE",
                        "derivedFrom": "Officer verified branch records: account opened as valid secondary salary link.",
                        "weight": 0.98
                      }
                    ],
                    "recommendedAction": "NO_ACTION"
                  },
                  {
                    "nodeId": "M2",
                    "aiClassification": "UNDER_REVIEW",
                    "confidence": 0.65,
                    "evidence": [
                      {
                        "source": "TRANSACTION_PATTERN",
                        "derivedFrom": "Remains suspicious secondary layering link.",
                        "weight": 0.7
                      }
                    ],
                    "recommendedAction": "PARTIAL_LIEN"
                  }
                ]
                """;
        }

        // Scenario 2: patil/m2/kyc keywords
        if (lowerPrompt.contains("kyc") || lowerPrompt.contains("m2") || lowerPrompt.contains("patil")) {
            return """
                [
                  {
                    "nodeId": "M2",
                    "aiClassification": "LIKELY_INNOCENT",
                    "confidence": 0.85,
                    "evidence": [
                      {
                        "source": "OFFICER_CHALLENGE",
                        "derivedFrom": "KYC matches valid profile under Vashi branch inspection.",
                        "weight": 0.95
                      }
                    ],
                    "recommendedAction": "NO_ACTION"
                  }
                ]
                """;
        }

        // Default initial assessment template
        return """
            [
              {
                "nodeId": "M1",
                "aiClassification": "SUSPECTED_MULE",
                "confidence": 0.95,
                "evidence": [
                  {
                    "source": "TRANSACTION_PATTERN",
                    "derivedFrom": "Persistent high velocity layering burst remains unresolved.",
                    "weight": 0.9
                  }
                ],
                "recommendedAction": "FULL_FREEZE"
              }
            ]
            """;
    }
}
