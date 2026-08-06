package com.muskets.backend.investigation.principal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muskets.backend.investigation.ai.AiClient;
import com.muskets.backend.investigation.ai.AiUnavailableException;
import com.muskets.backend.investigation.dto.internal.*;
import com.muskets.backend.investigation.store.InvestigationContextStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class StrDraftService {

    private static final Logger log = LoggerFactory.getLogger(StrDraftService.class);

    private static final String STR_SYSTEM_PROMPT = """
        You are a compliance officer assistant for an Indian bank regulated by RBI and FIU-IND under PMLA.
        Generate a concise Suspicious Transaction Report (STR) narrative in plain English.
        The narrative must include: account details summary, transaction pattern observed, triage signals,
        officer findings, evidence collected, AI assessment reasoning, and recommended containment action.
        Return ONLY the narrative text — no JSON, no markdown, no headers, no code blocks.
        Keep it under 500 words. Use Indian banking terminology (STR, FIU-IND, PMLA, lien, not SAR/FinCEN).
        Structure with numbered sections: 1. Subject Details, 2. Transaction Pattern, 3. Investigation Findings,
        4. Evidence Collected, 5. AI Assessment Summary, 6. Recommended Action.
        """;

    private final AiClient aiClient;
    private final InvestigationContextStore store;
    private final ObjectMapper objectMapper;

    public StrDraftService(AiClient aiClient, InvestigationContextStore store, ObjectMapper objectMapper) {
        this.aiClient = aiClient;
        this.store = store;
        this.objectMapper = objectMapper;
    }

    public StrDraft generateDraft(String caseId) {
        InvestigationContext ctx = store.get(caseId).orElseGet(() -> {
            InvestigationContext seed = new InvestigationContext();
            seed.setCaseId(caseId);
            seed.setCaseStatus("AWAITING_LEGAL_REVIEW");
            store.save(seed);
            return seed;
        });

        String userPrompt = buildStrPrompt(ctx);
        String narrative;
        try {
            narrative = aiClient.callPlainText(STR_SYSTEM_PROMPT, userPrompt);
        } catch (AiUnavailableException e) {
            throw new RuntimeException("STR draft generation unavailable: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("STR draft generation interrupted", e);
        } catch (Exception e) {  // AiClient.call() declares throws Exception — interface-forced broad catch
            throw new RuntimeException("STR draft generation failed: " + e.getMessage(), e);
        }

        // Safety: if LLM still returned JSON-wrapped text, extract the narrative value
        narrative = extractNarrativeIfJson(narrative);

        StrDraft draft = new StrDraft(narrative, Instant.now().toString(), false, "DRAFT");
        ctx.setStrDraft(draft);
        ctx.appendTimelineEntry("OFFICER_REVIEW", "Principal Officer", "STR Draft Generated",
            "AI-assisted STR narrative draft generated for FIU-IND submission.");
        ctx.bumpVersion();
        store.save(ctx);
        return draft;
    }

    public StrDraft updateDraft(String caseId, String editedNarrative) {
        InvestigationContext ctx = store.get(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        StrDraft updated = new StrDraft(editedNarrative, Instant.now().toString(), true, "DRAFT");
        ctx.setStrDraft(updated);
        ctx.bumpVersion();
        store.save(ctx);
        return updated;
    }

    /**
     * If the AI returned a JSON object containing a "narrative" or "text" field,
     * extract the value. Otherwise return the raw string as-is.
     */
    private String extractNarrativeIfJson(String raw) {
        if (raw == null || raw.isBlank()) return raw;
        String trimmed = raw.trim();
        if (!trimmed.startsWith("{")) return raw;

        try {
            JsonNode node = objectMapper.readTree(trimmed);
            // Try common field names the LLM might use
            for (String field : new String[]{"narrative", "text", "content", "report", "str_narrative"}) {
                if (node.has(field) && node.get(field).isTextual()) {
                    log.info("Extracted STR narrative from JSON field '{}'", field);
                    return node.get(field).asText();
                }
            }
            // If single text field, use it
            var fields = node.fields();
            if (fields.hasNext()) {
                var first = fields.next();
                if (first.getValue().isTextual() && !fields.hasNext()) {
                    log.info("Extracted STR narrative from single JSON field '{}'", first.getKey());
                    return first.getValue().asText();
                }
            }
        } catch (Exception e) {
            log.debug("STR response is not JSON, using as plain text");
        }
        return raw;
    }

    private String buildStrPrompt(InvestigationContext ctx) {
        StringBuilder sb = new StringBuilder();
        sb.append("Case ID: ").append(ctx.getCaseId()).append("\n");

        if (ctx.getSnapshot() != null) {
            sb.append("Customer: ").append(ctx.getSnapshot().customerName()).append("\n");
            sb.append("Account ID: ").append(ctx.getSnapshot().accountId()).append("\n");
            sb.append("Risk Amount: INR ").append(ctx.getSnapshot().riskAmount()).append("\n");
            sb.append("Traced Amount: INR ").append(ctx.getSnapshot().tracedAmount()).append("\n");
            sb.append("Total Balance: INR ").append(ctx.getSnapshot().totalBalance()).append("\n");
            sb.append("Priority: ").append(ctx.getSnapshot().priority()).append("\n");
            sb.append("Trigger: ").append(ctx.getSnapshot().triggerReason()).append("\n");
        }

        sb.append("\n--- Nodes in Network (").append(ctx.getNodes().size()).append(") ---\n");
        for (InvestigationNode node : ctx.getNodes()) {
            sb.append("  - ").append(node.getLabel()).append(" [").append(node.getNodeType()).append("]");
            sb.append(" verdict=").append(node.getOfficerVerdict());
            if (node.getAiAnalysis() != null) {
                sb.append(" ai=").append(node.getAiAnalysis().aiClassification());
                sb.append(" confidence=").append(node.getAiAnalysis().confidence());
                // Include AI evidence claims
                if (node.getAiAnalysis().evidence() != null) {
                    for (var claim : node.getAiAnalysis().evidence()) {
                        sb.append("\n      Evidence: [").append(claim.source()).append("] ");
                        sb.append(claim.derivedFrom()).append(" (weight=").append(claim.weight()).append(")");
                    }
                }
            }
            if (node.getNodeAction() != null) {
                sb.append(" action=").append(node.getNodeAction());
            }
            sb.append("\n");
        }

        // Evidence repository
        if (!ctx.getEvidenceRepository().isEmpty()) {
            sb.append("\n--- Evidence Repository (").append(ctx.getEvidenceRepository().size()).append(" items) ---\n");
            for (EvidenceItem item : ctx.getEvidenceRepository()) {
                sb.append("  - ").append(item.fileName())
                   .append(" (uploaded by ").append(item.uploadedBy())
                   .append(" at ").append(item.uploadedAt())
                   .append(", ").append(item.fileSize()).append(" bytes)\n");
            }
        }

        if (ctx.getRecommendation() != null) {
            sb.append("\nOfficer Recommendation: ").append(ctx.getRecommendation().selectedAction()).append("\n");
            sb.append("Rationale: ").append(ctx.getRecommendation().rationale()).append("\n");
        }

        sb.append("\nTimeline events: ").append(ctx.getTimeline().size()).append("\n");

        return sb.toString();
    }
}

