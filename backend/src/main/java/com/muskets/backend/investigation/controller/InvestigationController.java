package com.muskets.backend.investigation.controller;

import com.muskets.backend.investigation.dto.internal.CaseSnapshot;
import com.muskets.backend.investigation.dto.internal.InvestigationContext;
import com.muskets.backend.investigation.dto.internal.OfficerRecommendation;
import com.muskets.backend.investigation.service.InvestigationService;
import com.muskets.backend.investigation.service.InvestigationStatusMachine;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller exposing primary investigation lifecycle endpoints.
 */
@RestController
@RequestMapping("/api/investigation")
public class InvestigationController {

    private final InvestigationService investigationService;
    private final InvestigationStatusMachine statusMachine;

    public InvestigationController(InvestigationService investigationService, InvestigationStatusMachine statusMachine) {
        this.investigationService = investigationService;
        this.statusMachine = statusMachine;
    }

    /**
     * Start/initialize case context.
     * Returns CaseSnapshotResponse containing metadata.
     */
    @PostMapping("/{caseId}/start")
    public ResponseEntity<CaseSnapshot> startInvestigation(@PathVariable String caseId) {
        try {
            CaseSnapshot snapshot = investigationService.startInvestigation(caseId);
            return ResponseEntity.ok(snapshot);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Confirms snapshot and populates the connected nodes graph.
     */
    @PostMapping("/{caseId}/build-graph")
    public ResponseEntity<InvestigationContext> buildGraph(@PathVariable String caseId) {
        try {
            InvestigationContext context = investigationService.buildGraph(caseId);
            return ResponseEntity.ok(context);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Retrieves the entire current investigation context for the case.
     */
    @GetMapping("/{caseId}")
    public ResponseEntity<InvestigationContext> getContext(@PathVariable String caseId) {
        return investigationService.getContext(caseId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Sets case-level action recommendation.
     */
    @PostMapping("/{caseId}/recommendation")
    public ResponseEntity<Map<String, String>> setRecommendation(
            @PathVariable String caseId, 
            @RequestBody OfficerRecommendation recommendation) {
        try {
            investigationService.saveRecommendation(caseId, recommendation);
            return ResponseEntity.ok(Map.of("message", "Recommendation updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Exposes generated summary report for audit.
     */
    @GetMapping("/{caseId}/summary")
    public ResponseEntity<com.muskets.backend.investigation.dto.response.InvestigationSummaryResponse> getSummaryReport(@PathVariable String caseId) {
        try {
            return ResponseEntity.ok(investigationService.getSummaryReport(caseId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Close case as false positive anomaly.
     */
    @PostMapping("/{caseId}/close-false-positive")
    public ResponseEntity<Map<String, String>> closeFalsePositive(
            @PathVariable String caseId,
            @RequestBody Map<String, String> payload) {
        
        InvestigationContext context = investigationService.getContext(caseId).orElse(null);
        if (context == null) {
            return ResponseEntity.notFound().build();
        }

        String reason = payload.getOrDefault("reason", "No reason provided");
        String currentStatus = context.getCaseStatus();
        String targetStatus = "CLOSED_FALSE_POSITIVE";

        if (!statusMachine.isValidTransition(currentStatus, targetStatus)) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Illegal transition from " + currentStatus + " to " + targetStatus
            ));
        }

        context.setCaseStatus(targetStatus);
        context.appendTimelineEntry(
            "OFFICER_REVIEW", 
            "AML Officer", 
            "Case Closed", 
            "Closed as false positive. Reason: " + reason
        );
        investigationService.startInvestigation(caseId); // force saving to store
        return ResponseEntity.ok(Map.of("message", "Case closed successfully"));
    }

    /**
     * Proceed/escalate case to Legal Review.
     */
    @PostMapping("/{caseId}/proceed")
    public ResponseEntity<Map<String, String>> proceed(
            @PathVariable String caseId,
            @RequestBody com.muskets.backend.investigation.dto.request.ProceedRequest request) {
        
        InvestigationContext context = investigationService.getContext(caseId).orElse(null);
        if (context == null) {
            return ResponseEntity.notFound().build();
        }

        String currentStatus = context.getCaseStatus();
        String targetStatus = "AWAITING_LEGAL_REVIEW";

        if (!statusMachine.isValidTransition(currentStatus, targetStatus)) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Illegal transition from " + currentStatus + " to " + targetStatus
            ));
        }

        // Enforce investigation progress model: all nodes must be reviewed
        boolean allReviewed = context.getNodes().stream()
            .allMatch(n -> n.getOfficerVerdict() != com.muskets.backend.investigation.dto.internal.OfficerVerdict.UNREVIEWED);
        if (!allReviewed) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Cannot escalate to legal review: one or more nodes are pending review."
            ));
        }

        context.setCaseStatus(targetStatus);
        context.appendTimelineEntry(
            "OFFICER_REVIEW", 
            request.officerId(), 
            "Case Escalated to Legal Review", 
            "Officer " + request.officerId() + " approved final recommendation and escalated the dossier."
        );
        investigationService.startInvestigation(caseId); // force saving status update to store
        return ResponseEntity.ok(Map.of("message", "Escalated to Legal Review successfully"));
    }
}
