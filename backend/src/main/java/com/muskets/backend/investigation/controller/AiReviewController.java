package com.muskets.backend.investigation.controller;

import com.muskets.backend.investigation.ai.AiUnavailableException;
import com.muskets.backend.investigation.ai.RateLimitExceededException;
import com.muskets.backend.investigation.dto.internal.AiSchemaContract;
import com.muskets.backend.investigation.dto.request.ReanalyzeRequest;
import com.muskets.backend.investigation.service.AiOrchestrationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller exposing endpoints to trigger AI reanalysis and challenges.
 */
@RestController
@RequestMapping("/api/investigation")
public class AiReviewController {

    private final AiOrchestrationService aiOrchestrationService;

    public AiReviewController(AiOrchestrationService aiOrchestrationService) {
        this.aiOrchestrationService = aiOrchestrationService;
    }

    /**
     * Re-evaluate suspect network classifications based on officer comments.
     */
    @PostMapping("/{caseId}/reanalyze")
    public ResponseEntity<?> reanalyze(
            @PathVariable String caseId,
            @RequestBody ReanalyzeRequest request) {
        try {
            if (request.focusNodeId() == null || request.focusNodeId().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Focus node ID cannot be empty"));
            }
            if (request.officerComment() == null || request.officerComment().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Officer comment feedback cannot be empty"));
            }

            List<AiSchemaContract> results = aiOrchestrationService.reanalyze(
                caseId, 
                request.focusNodeId(), 
                request.officerComment()
            );
            return ResponseEntity.ok(results);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("error", e.getMessage()));
        } catch (RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("error", e.getMessage()));
        } catch (AiUnavailableException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Triggers the background AI triage scan (initial assessment generation) on-demand.
     */
    @PostMapping("/{caseId}/refresh-ai")
    public ResponseEntity<?> refreshAi(@PathVariable String caseId) {
        try {
            aiOrchestrationService.generateInitialAssessmentAsync(caseId);
            return ResponseEntity.ok(Map.of("message", "Background AI assessment generation triggered successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
}
