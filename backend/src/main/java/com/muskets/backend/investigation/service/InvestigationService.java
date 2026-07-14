package com.muskets.backend.investigation.service;

import com.muskets.backend.investigation.dto.internal.*;
import com.muskets.backend.investigation.store.InvestigationContextStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Service orchestrating investigation workflows.
 *
 * <p>Acts as the bridge between REST controllers and {@link InvestigationContextStore}.</p>
 */
@Service
public class InvestigationService {

    private static final Logger log = LoggerFactory.getLogger(InvestigationService.class);

    private final InvestigationContextStore store;
    private final CaseContextBuilder contextBuilder;
    private final AiOrchestrationService aiOrchestrationService;

    public InvestigationService(
            InvestigationContextStore store,
            CaseContextBuilder contextBuilder,
            AiOrchestrationService aiOrchestrationService) {
        this.store = store;
        this.contextBuilder = contextBuilder;
        this.aiOrchestrationService = aiOrchestrationService;
    }

    /**
     * Starts an investigation on a case.
     *
     * <p>If already present in the store, returns the existing state.
     * Otherwise, loads the seed template, saves it, and returns the snapshot.</p>
     */
    public CaseSnapshot startInvestigation(String caseId) {
        log.info("Starting investigation workflow for case {}", caseId);

        InvestigationContext context = store.get(caseId).orElseGet(() -> {
            log.info("Case {} not in store. Loading seed data.", caseId);
            InvestigationContext seed = contextBuilder.loadSeedContext(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found or seed missing: " + caseId));
            
            // Record start event in timeline
            seed.appendTimelineEntry(
                "OFFICER_REVIEW",
                "AML Officer",
                "Investigation Initiated",
                "Officer opened the case and initiated triage review."
            );
            
            store.save(seed);
            return seed;
        });

        return context.getSnapshot();
    }

    /**
     * Confirms the snapshot and builds the suspect graph.
     *
     * <p>Updates the status to active in the store and adds a timeline event.</p>
     */
    public InvestigationContext buildGraph(String caseId) {
        log.info("Building suspect graph for case {}", caseId);
        
        InvestigationContext context = store.get(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Investigation not started: " + caseId));

        if ("PENDING_TRIAGE".equals(context.getCaseStatus())) {
            context.setCaseStatus("UNDER_INVESTIGATION");
            context.setAiGenerating(true);
            context.appendTimelineEntry(
                "SYSTEM_ALERT",
                "System",
                "Suspect Graph Constructed",
                "Connected accounts within 4 hops populated in workcanvas."
            );
            store.save(context);

            // Kick off background assessment
            aiOrchestrationService.generateInitialAssessmentAsync(caseId);
        }

        return context;
    }

    /**
     * Gets the full active investigation context.
     */
    public Optional<InvestigationContext> getContext(String caseId) {
        return store.get(caseId);
    }

    /**
     * Retrieves detail information for a specific node in a case.
     */
    public Optional<InvestigationNode> getNodeDetail(String caseId, String nodeId) {
        return store.get(caseId)
            .flatMap(ctx -> ctx.getNodes().stream()
                .filter(n -> n.getNodeId().equals(nodeId))
                .findFirst());
    }

    /**
     * Saves a case-level recommendation.
     */
    public void saveRecommendation(String caseId, OfficerRecommendation recommendation) {
        log.info("Saving case recommendation for case {}: {}", caseId, recommendation.selectedAction());
        
        InvestigationContext context = store.get(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        context.setRecommendation(recommendation);
        context.appendTimelineEntry(
            "OFFICER_REVIEW",
            recommendation.officerId(),
            "Recommendation Recorded",
            "Officer selected case recommendation: " + recommendation.selectedAction()
        );
        context.bumpVersion();
        store.save(context);
    }

    /**
     * Generates a complete audit summary report.
     */
    public com.muskets.backend.investigation.dto.response.InvestigationSummaryResponse getSummaryReport(String caseId) {
        InvestigationContext context = store.get(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        OfficerRecommendation rec = context.getRecommendation();
        String recommendingOfficer = rec != null ? rec.officerId() : "N/A";
        String finalAction = rec != null ? rec.selectedAction() : "PENDING_DECISION";
        String rationale = rec != null ? rec.rationale() : "No rationale recorded yet.";

        List<com.muskets.backend.investigation.dto.response.InvestigationSummaryResponse.NodeSummaryInfo> nodeInfos = context.getNodes().stream()
            .map(n -> new com.muskets.backend.investigation.dto.response.InvestigationSummaryResponse.NodeSummaryInfo(
                n.getNodeId(),
                n.getLabel(),
                n.getNodeType(),
                n.getOfficerVerdict().name(),
                n.getNodeAction().name(),
                n.getAiAnalysis() != null ? n.getAiAnalysis().aiClassification().name() : "UNCLASSIFIED",
                n.getAiAnalysis() != null ? n.getAiAnalysis().confidence() : 0.0
            ))
            .toList();

        return new com.muskets.backend.investigation.dto.response.InvestigationSummaryResponse(
            context.getCaseId(),
            recommendingOfficer,
            finalAction,
            rationale,
            nodeInfos,
            context.getTimeline(),
            context.getCaseNotes(),
            Instant.now().toString()
        );
    }
}
