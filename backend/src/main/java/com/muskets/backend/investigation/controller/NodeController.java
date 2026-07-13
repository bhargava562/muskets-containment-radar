package com.muskets.backend.investigation.controller;

import com.muskets.backend.investigation.dto.internal.InvestigationNode;
import com.muskets.backend.investigation.dto.internal.NodeAction;
import com.muskets.backend.investigation.dto.internal.OfficerVerdict;
import com.muskets.backend.investigation.dto.request.NodeActionUpdateRequest;
import com.muskets.backend.investigation.dto.request.NodeReviewStatusUpdateRequest;
import com.muskets.backend.investigation.service.InvestigationService;
import com.muskets.backend.investigation.service.NodeReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller exposing endpoints to fetch individual node profile details and update review metrics.
 */
@RestController
@RequestMapping("/api/investigation")
public class NodeController {

    private final InvestigationService investigationService;
    private final NodeReviewService nodeReviewService;

    public NodeController(InvestigationService investigationService, NodeReviewService nodeReviewService) {
        this.investigationService = investigationService;
        this.nodeReviewService = nodeReviewService;
    }

    /**
     * Gets full profile info for a specific node (KYC, CBS, device, transactions, etc.).
     */
    @GetMapping("/{caseId}/node/{nodeId}")
    public ResponseEntity<InvestigationNode> getNodeDetail(
            @PathVariable String caseId, 
            @PathVariable String nodeId) {
        return investigationService.getNodeDetail(caseId, nodeId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Set officer verdict status (CONFIRMED, DISPUTED, CLEARED, NEEDS_MORE_EVIDENCE).
     */
    @PostMapping("/{caseId}/node/{nodeId}/review-status")
    public ResponseEntity<Map<String, String>> setReviewStatus(
            @PathVariable String caseId,
            @PathVariable String nodeId,
            @RequestBody NodeReviewStatusUpdateRequest request) {
        try {
            OfficerVerdict verdict = OfficerVerdict.valueOf(request.officerVerdict());
            nodeReviewService.updateVerdict(caseId, nodeId, verdict, request.officerNote());
            return ResponseEntity.ok(Map.of("message", "Verdict status updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid verdict value: " + request.officerVerdict()));
        }
    }

    /**
     * Set containment action recommendation (NO_ACTION, MONITOR, etc.).
     */
    @PostMapping("/{caseId}/node/{nodeId}/action")
    public ResponseEntity<Map<String, String>> setNodeAction(
            @PathVariable String caseId,
            @PathVariable String nodeId,
            @RequestBody NodeActionUpdateRequest request) {
        try {
            NodeAction action = NodeAction.valueOf(request.nodeAction());
            nodeReviewService.updateNodeAction(caseId, nodeId, action);
            return ResponseEntity.ok(Map.of("message", "Containment action recommendation updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid action value: " + request.nodeAction()));
        }
    }
}
