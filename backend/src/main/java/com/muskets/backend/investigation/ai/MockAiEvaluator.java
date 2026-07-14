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
