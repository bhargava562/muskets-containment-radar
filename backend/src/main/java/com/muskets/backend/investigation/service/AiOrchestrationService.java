package com.muskets.backend.investigation.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muskets.backend.investigation.ai.AiClient;
import com.muskets.backend.investigation.ai.AiPromptBuilder;
import com.muskets.backend.investigation.dto.internal.AiSchemaContract;
import com.muskets.backend.investigation.dto.internal.InvestigationContext;
import com.muskets.backend.investigation.store.InvestigationContextStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Orchestrates the full-context AI loop.
 *
 * <p>Enforces strict output validations, rate limiting, and timeout protections.</p>
 */
@Service
public class AiOrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(AiOrchestrationService.class);

    private static final Set<String> VALID_CLASSIFICATIONS = Set.of(
        "CONFIRMED_VICTIM", "SUSPECTED_MULE", "UNDER_REVIEW", "LIKELY_INNOCENT", "CLEARED"
    );

    private final InvestigationContextStore store;
    private final AiClient aiClient;
    private final AiPromptBuilder promptBuilder;
    private final ObjectMapper objectMapper;

    // 5-line global daily call counter
    private final AtomicInteger dailyCalls = new AtomicInteger(0);

    public AiOrchestrationService(
            InvestigationContextStore store,
            AiClient aiClient,
            AiPromptBuilder promptBuilder,
            ObjectMapper objectMapper) {
        this.store = store;
        this.aiClient = aiClient;
        this.promptBuilder = promptBuilder;
        this.objectMapper = objectMapper;
    }

    /**
     * Daily scheduled reset at midnight.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void resetDailyRateLimit() {
        log.info("Resetting daily Copilot rate limiter counter.");
        dailyCalls.set(0);
    }

    public List<AiSchemaContract> reanalyze(String caseId, String focusNodeId, String comment) {
        // 1. Rate Limiting Check
        if (dailyCalls.incrementAndGet() > 200) {
            throw new RuntimeException("Daily AI call limit reached (max 200 calls/day)");
        }

        // 2. Fetch context
        InvestigationContext context = store.get(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        // 3. Build system & user prompts
        String systemPrompt = promptBuilder.buildSystemPrompt();
        String userPrompt = promptBuilder.buildUserPrompt(context, focusNodeId, comment);

        String rawResponse;
        try {
            // 4. Fire API call
            rawResponse = aiClient.call(systemPrompt, userPrompt);
        } catch (Exception e) {
            log.error("AI Copilot request failed or timed out", e);
            throw new RuntimeException("AI service unavailable, please retry.");
        }

        // 5. Parse and Validate Response
        List<AiSchemaContract> validated = validateOrThrow(rawResponse, context);

        // 6. Apply classifications and save
        context.applyAiRevision(validated, focusNodeId, comment, Instant.now().toString());
        store.save(context);

        return validated;
    }

    private List<AiSchemaContract> validateOrThrow(String rawJson, InvestigationContext context) {
        try {
            List<AiSchemaContract> parsed = objectMapper.readValue(rawJson, new TypeReference<List<AiSchemaContract>>() {});
            
            Set<String> knownNodeIds = context.getNodes().stream()
                .map(com.muskets.backend.investigation.dto.internal.InvestigationNode::getNodeId)
                .collect(Collectors.toSet());

            for (AiSchemaContract item : parsed) {
                // Ensure nodeId matches existing set
                if (!knownNodeIds.contains(item.nodeId())) {
                    throw new IllegalArgumentException("AI returned classification for unknown nodeId: " + item.nodeId());
                }
                
                // Ensure confidence matches [0.0, 1.0] range
                if (item.confidence() < 0.0 || item.confidence() > 1.0) {
                    throw new IllegalArgumentException("AI confidence score out of bounds: " + item.confidence());
                }

                // Ensure classification belongs to valid enum values
                if (!VALID_CLASSIFICATIONS.contains(item.aiClassification())) {
                    throw new IllegalArgumentException("AI returned illegal classification value: " + item.aiClassification());
                }
            }

            return parsed;
        } catch (Exception e) {
            log.error("Failed to parse or validate AI Copilot response payload", e);
            throw new IllegalArgumentException("AI returned invalid structure: " + e.getMessage());
        }
    }
}
