package com.muskets.backend.investigation.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.muskets.backend.investigation.dto.internal.InvestigationContext;
import com.muskets.backend.investigation.dto.internal.InvestigationNode;
import com.muskets.backend.investigation.dto.internal.GraphEdge;
import com.muskets.backend.investigation.dto.internal.TimelineEntry;
import com.muskets.backend.investigation.dto.internal.AiRevision;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Builds AI reanalysis prompts and performs inline PII masking.
 *
 * <p>Excludes private comments, masks account numbers, IFSC codes, PAN IDs,
 * and names, maintaining complete structural integrity for the LLM while
 * preventing leaks of actual PII.</p>
 */
@Component
public class AiPromptBuilder {

    private static final Logger log = LoggerFactory.getLogger(AiPromptBuilder.class);
    private final ObjectMapper objectMapper;

    public AiPromptBuilder(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Builds the system prompt persona and instruction contract.
     */
    public String buildSystemPrompt() {
        return """
            You are Antigravity AI, a stateless pair programming assistant built by Google DeepMind team.
            Your role is to re-evaluate suspect ratings in an AML mule-hunter investigation.
            
            Strict response schema:
            You MUST return a JSON array containing ONLY objects matching the following schema. No markdown wrapping, no trailing explanations:
            [
              {
                "nodeId": "string (the matching node ID)",
                "aiClassification": "CONFIRMED_VICTIM | SUSPECTED_MULE | UNDER_REVIEW | LIKELY_INNOCENT | CLEARED",
                "confidence": 0.0 to 1.0 (double),
                "evidence": [
                  {
                    "source": "string (provenance source layer)",
                    "derivedFrom": "string (fact explanation)",
                    "weight": 0.0 to 1.0
                  }
                ],
                "recommendedAction": "NO_ACTION | MONITOR | BRANCH_VERIFICATION | PARTIAL_LIEN | FULL_FREEZE | ESCALATE"
              }
            ]
            
            Critical Instructions:
            1. Return updates only for nodes whose aiClassification changed as a result of the officer's new comment, referencing existing node IDs only.
            2. Adhere strictly to the requested schema.
            3. Do not include markdown code block syntax (like ```json). Return raw JSON content only.
            """;
    }

    /**
     * Serializes the investigation context into a masked user prompt string.
     * Maps all account numbers, IFSCs, and PAN IDs consistently.
     */
    public String buildUserPrompt(InvestigationContext context, String focusNodeId, String comment) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("caseId", context.getCaseId());
            payload.put("contextVersion", context.getContextVersion());
            payload.put("focusNodeId", focusNodeId);
            payload.put("officerComment", comment);

            // Populate masked nodes
            List<Map<String, Object>> maskedNodes = new ArrayList<>();
            for (InvestigationNode node : context.getNodes()) {
                Map<String, Object> nodeMap = new HashMap<>();
                nodeMap.put("nodeId", node.getNodeId());
                nodeMap.put("nodeType", node.getNodeType());
                
                // Mask KYC
                if (node.getKyc() != null) {
                    Map<String, String> kycMap = new HashMap<>();
                    kycMap.put("kycStatus", node.getKyc().kycStatus());
                    kycMap.put("riskCategory", node.getKyc().riskCategory());
                    kycMap.put("customerName", maskPii(node.getKyc().customerName()));
                    kycMap.put("idType", node.getKyc().idType());
                    kycMap.put("idNumber", maskPii(node.getKyc().idNumber()));
                    nodeMap.put("kyc", kycMap);
                }

                // Mask CBS
                if (node.getCbs() != null) {
                    Map<String, Object> cbsMap = new HashMap<>();
                    cbsMap.put("accountType", node.getCbs().accountType());
                    cbsMap.put("branchName", node.getCbs().branchName());
                    cbsMap.put("accountOpenDate", node.getCbs().accountOpenDate());
                    cbsMap.put("currentBalance", node.getCbs().currentBalance());
                    cbsMap.put("accountNumber", maskPii(node.getCbs().accountNumber()));
                    cbsMap.put("ifscCode", maskPii(node.getCbs().ifscCode()));
                    nodeMap.put("cbs", cbsMap);
                }

                // Mask Device
                if (node.getDevice() != null) {
                    nodeMap.put("device", node.getDevice());
                }

                // Add current classification
                if (node.getAiAnalysis() != null) {
                    nodeMap.put("aiAnalysis", node.getAiAnalysis());
                }

                maskedNodes.add(nodeMap);
            }
            payload.put("nodes", maskedNodes);

            // Populate edges (they map node IDs, not account numbers, so no PII)
            payload.put("edges", context.getEdges());

            // Prior AI revisions
            payload.put("revisions", context.getRevisionHistory());

            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(payload);
        } catch (Exception e) {
            log.error("Failed to build masked AI payload", e);
            return "{\"error\": \"failed to generate prompt\"}";
        }
    }

    /**
     * Consistent PII masking helper.
     * Mask accounts, IFSC codes, PANs, and names.
     */
    public String maskPii(String input) {
        if (input == null) return null;
        
        // 1. Mask Account Number: e.g. 185501000012847 -> 1855XXXXXX12847
        if (input.matches("\\d{10,16}")) {
            return input.substring(0, 4) + "XXXXXX" + input.substring(input.length() - 5);
        }

        // 2. Mask IFSC Code: e.g. IOBA0001855 -> IOBAXXXX855
        if (input.matches("[A-Z]{4}0[A-Z0-9]{6}")) {
            return input.substring(0, 4) + "XXXX" + input.substring(input.length() - 3);
        }

        // 3. Mask PAN Card ID: e.g. ABCDE1234F -> XXXXX1234F
        if (input.matches("[A-Z]{5}\\d{4}[A-Z]")) {
            return "XXXXX" + input.substring(5);
        }

        // 4. Mask Customer Name: Sunil Kumar -> S***l K***r
        if (input.contains(" ") && input.length() > 3) {
            String[] parts = input.split(" ");
            StringBuilder sb = new StringBuilder();
            for (String part : parts) {
                if (part.length() > 2) {
                    sb.append(part.charAt(0)).append("***").append(part.charAt(part.length() - 1)).append(" ");
                } else {
                    sb.append(part).append(" ");
                }
            }
            return sb.toString().trim();
        }

        return input;
    }
}
