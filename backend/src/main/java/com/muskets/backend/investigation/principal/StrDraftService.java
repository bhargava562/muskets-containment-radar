package com.muskets.backend.investigation.principal;

import com.muskets.backend.investigation.ai.AiClient;
import com.muskets.backend.investigation.ai.AiUnavailableException;
import com.muskets.backend.investigation.dto.internal.InvestigationContext;
import com.muskets.backend.investigation.dto.internal.InvestigationNode;
import com.muskets.backend.investigation.dto.internal.StrDraft;
import com.muskets.backend.investigation.store.InvestigationContextStore;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class StrDraftService {

    private static final String STR_SYSTEM_PROMPT = """
        You are a compliance officer assistant for an Indian bank regulated by RBI and FIU-IND under PMLA.
        Generate a concise Suspicious Transaction Report (STR) narrative in plain English.
        The narrative must include: account details summary, transaction pattern observed, triage signals,
        officer findings, and recommended containment action.
        Return ONLY the narrative text — no JSON, no markdown, no headers.
        Keep it under 300 words. Use Indian banking terminology (STR, FIU-IND, PMLA, lien, not SAR/FinCEN).
        """;

    private final AiClient aiClient;
    private final InvestigationContextStore store;

    public StrDraftService(AiClient aiClient, InvestigationContextStore store) {
        this.aiClient = aiClient;
        this.store = store;
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
            narrative = aiClient.call(STR_SYSTEM_PROMPT, userPrompt);
        } catch (AiUnavailableException e) {
            throw new RuntimeException("STR draft generation unavailable: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("STR draft generation interrupted", e);
        } catch (Exception e) {  // AiClient.call() declares throws Exception — interface-forced broad catch
            throw new RuntimeException("STR draft generation failed: " + e.getMessage(), e);
        }

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

    private String buildStrPrompt(InvestigationContext ctx) {
        StringBuilder sb = new StringBuilder();
        sb.append("Case ID: ").append(ctx.getCaseId()).append("\n");

        if (ctx.getSnapshot() != null) {
            sb.append("Customer: ").append(ctx.getSnapshot().customerName()).append("\n");
            sb.append("Risk Amount: INR ").append(ctx.getSnapshot().riskAmount()).append("\n");
            sb.append("Traced Amount: INR ").append(ctx.getSnapshot().tracedAmount()).append("\n");
            sb.append("Trigger: ").append(ctx.getSnapshot().triggerReason()).append("\n");
        }

        sb.append("Nodes in network: ").append(ctx.getNodes().size()).append("\n");
        for (InvestigationNode node : ctx.getNodes()) {
            sb.append("  - ").append(node.getLabel()).append(" [").append(node.getNodeType()).append("]");
            sb.append(" verdict=").append(node.getOfficerVerdict());
            if (node.getAiAnalysis() != null) {
                sb.append(" ai=").append(node.getAiAnalysis().aiClassification());
                sb.append(" confidence=").append(node.getAiAnalysis().confidence());
            }
            sb.append("\n");
        }

        if (ctx.getRecommendation() != null) {
            sb.append("Officer Recommendation: ").append(ctx.getRecommendation().selectedAction()).append("\n");
            sb.append("Rationale: ").append(ctx.getRecommendation().rationale()).append("\n");
        }

        sb.append("Evidence files: ").append(ctx.getEvidenceRepository().size()).append("\n");
        sb.append("Timeline events: ").append(ctx.getTimeline().size()).append("\n");

        return sb.toString();
    }
}
