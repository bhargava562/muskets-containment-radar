package com.muskets.backend.investigation.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muskets.backend.investigation.InvestigationConfig;
import com.muskets.backend.investigation.ai.AiClient;
import com.muskets.backend.investigation.ai.AiPromptBuilder;
import com.muskets.backend.investigation.ai.AiUnavailableException;
import com.muskets.backend.investigation.ai.RateLimitExceededException;
import com.muskets.backend.investigation.dto.internal.*;
import com.muskets.backend.investigation.store.InvestigationContextStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
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
 * <p>Enforces strict output validations, rate limiting, and retry policies.</p>
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
    private final InvestigationConfig config;

    // 5-line global daily call counter
    private final AtomicInteger dailyCalls = new AtomicInteger(0);

    public AiOrchestrationService(
            InvestigationContextStore store,
            AiClient aiClient,
            AiPromptBuilder promptBuilder,
            ObjectMapper objectMapper,
            InvestigationConfig config) {
        this.store = store;
        this.aiClient = aiClient;
        this.promptBuilder = promptBuilder;
        this.objectMapper = objectMapper;
        this.config = config;
    }

    @Scheduled(cron = "0 0 0 * * ?")
    public void resetDailyRateLimit() {
        log.info("Resetting daily Copilot rate limiter counter.");
        dailyCalls.set(0);
    }

    private void checkRateLimit() {
        int maxCalls = config.getInvestigation().getReanalyzeRateLimitPerDay();
        if (dailyCalls.incrementAndGet() > maxCalls) {
            throw new RateLimitExceededException("Daily AI call limit reached (max " + maxCalls + " calls/day)");
        }
    }

    /**
     * Helper that calls the AI client and measures performance telemetry.
     */
    private String callClientWithTelemetry(String systemPrompt, String userPrompt, InvestigationContext context) throws Exception {
        long startTime = System.currentTimeMillis();
        String response = aiClient.call(systemPrompt, userPrompt);
        long duration = System.currentTimeMillis() - startTime;

        boolean isLive = config.getAi().getApiKey() != null && !config.getAi().getApiKey().isBlank() && !"MOCK_KEY".equals(config.getAi().getApiKey());
        AiResponseMetadata meta = new AiResponseMetadata(
            isLive,
            config.getAi().getProvider(),
            config.getAi().getModel(),
            duration,
            Instant.now().toString()
        );
        context.setAiResponseMetadata(meta);
        return response;
    }

    /**
     * Executes AI client request with a retry-once policy ONLY on JSON parsing or validation failures.
     */
    private List<AiSchemaContract> callWithRetry(String systemPrompt, String userPrompt, InvestigationContext context) throws Exception {
        String rawResponse;
        try {
            rawResponse = callClientWithTelemetry(systemPrompt, userPrompt, context);
            return validateOrThrow(rawResponse, context);
        } catch (IllegalArgumentException | com.fasterxml.jackson.core.JsonProcessingException e) {
            // JSON parsing or logic validation failed - retry once with error feedback
            log.warn("First AI generation failed validation: {}. Retrying once with error feedback.", e.getMessage());
            String retryUserPrompt = userPrompt + "\n\nYour previous response was invalid: " 
                + e.getMessage() + ". Return ONLY valid JSON matching the schema.";
            
            rawResponse = callClientWithTelemetry(systemPrompt, retryUserPrompt, context);
            return validateOrThrow(rawResponse, context);
        }
        // Network timeouts, 429, 503, 401 (AiUnavailableException) propagate immediately without retry
    }

    /**
     * Generates initial node classifications asynchronously to keep graph rendering non-blocking.
     */
    @Async
    public void generateInitialAssessmentAsync(String caseId) {
        log.info("Starting background initial AI assessment for case {}", caseId);
        
        InvestigationContext context = store.get(caseId).orElse(null);
        if (context == null) {
            log.error("Failed to generate initial assessment: case context {} not found", caseId);
            return;
        }

        try {
            // Apply generating flag
            context.setAiGenerating(true);
            store.save(context);

            checkRateLimit();

            String systemPrompt = promptBuilder.buildSystemPrompt();
            String userPrompt = promptBuilder.buildUserPrompt(context, null, "Initial network triage scan.");

            List<AiSchemaContract> validated = callWithRetry(systemPrompt, userPrompt, context);

            // Populate initial node analyses
            for (AiSchemaContract item : validated) {
                for (InvestigationNode node : context.getNodes()) {
                    if (node.getNodeId().equals(item.nodeId())) {
                        AiClassification classification = AiClassification.valueOf(item.aiClassification());
                        AiAnalysis analysis = new AiAnalysis(
                            classification,
                            item.confidence(),
                            item.evidence(),
                            item.recommendedAction(),
                            "AI generated initial triage evaluation."
                        );
                        node.setAiAnalysis(analysis);
                        break;
                    }
                }
            }

            context.appendTimelineEntry(
                "SYSTEM_ALERT",
                "AI Copilot",
                "Initial Triage Scan Complete",
                "AI network scan and initial node classifications completed successfully."
            );
            
        } catch (Exception e) {
            log.error("Failed to generate initial assessment for case: " + caseId, e);
            // Log fallback
            context.appendTimelineEntry(
                "SYSTEM_ALERT",
                "System",
                "Suspect Graph Constructed",
                "Connected accounts within 4 hops populated in workcanvas (offline fallback)."
            );
        } finally {
            context.setAiGenerating(false);
            store.save(context);
        }
    }

    /**
     * Reanalyzes context based on officer comment.
     */
    public List<AiSchemaContract> reanalyze(String caseId, String focusNodeId, String comment) throws Exception {
        checkRateLimit();

        InvestigationContext context = store.get(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        context.setAiGenerating(true);
        store.save(context);

        try {
            String systemPrompt = promptBuilder.buildSystemPrompt();
            String userPrompt = promptBuilder.buildUserPrompt(context, focusNodeId, comment);

            List<AiSchemaContract> validated = callWithRetry(systemPrompt, userPrompt, context);

            context.applyAiRevision(validated, focusNodeId, comment, Instant.now().toString());
            return validated;
        } finally {
            context.setAiGenerating(false);
            store.save(context);
        }
    }

    private List<AiSchemaContract> validateOrThrow(String rawJson, InvestigationContext context) throws Exception {
        List<AiSchemaContract> parsed = objectMapper.readValue(rawJson, new TypeReference<List<AiSchemaContract>>() {});
        
        Set<String> knownNodeIds = context.getNodes().stream()
            .map(InvestigationNode::getNodeId)
            .collect(Collectors.toSet());

        for (AiSchemaContract item : parsed) {
            if (!knownNodeIds.contains(item.nodeId())) {
                throw new IllegalArgumentException("AI returned classification for unknown nodeId: " + item.nodeId());
            }
            if (item.confidence() < 0.0 || item.confidence() > 1.0) {
                throw new IllegalArgumentException("AI confidence score out of bounds: " + item.confidence());
            }
            if (!VALID_CLASSIFICATIONS.contains(item.aiClassification())) {
                throw new IllegalArgumentException("AI returned illegal classification value: " + item.aiClassification());
            }
        }
        return parsed;
    }
}
