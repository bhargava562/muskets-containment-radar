package com.muskets.backend.investigation.principal;

import com.muskets.backend.investigation.dto.internal.InvestigationContext;
import com.muskets.backend.investigation.dto.internal.StrDraft;
import com.muskets.backend.investigation.dto.request.PrincipalDecisionRequest;
import com.muskets.backend.investigation.service.InvestigationService;
import com.muskets.backend.investigation.service.InvestigationStatusMachine;
import com.muskets.backend.investigation.store.InvestigationContextStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/investigation")
public class PrincipalReviewController {

    private final InvestigationContextStore store;
    private final InvestigationStatusMachine statusMachine;
    private final StrDraftService strDraftService;
    private final InvestigationService investigationService;

    public PrincipalReviewController(
            InvestigationContextStore store,
            InvestigationStatusMachine statusMachine,
            StrDraftService strDraftService,
            InvestigationService investigationService) {
        this.store = store;
        this.statusMachine = statusMachine;
        this.strDraftService = strDraftService;
        this.investigationService = investigationService;
    }

    /**
     * Returns an existing context or seeds a minimal one for cases that arrived
     * via the SSE/mock path and never went through the AML Officer start flow.
     */
    private InvestigationContext getOrSeedContext(String caseId, String assumedStatus) {
        return store.get(caseId).orElseGet(() -> {
            InvestigationContext ctx = new InvestigationContext();
            ctx.setCaseId(caseId);
            ctx.setCaseStatus(assumedStatus);
            ctx.appendTimelineEntry("SYSTEM_ALERT", "System",
                "Context auto-seeded",
                "Case arrived via SSE alert path. Minimal context created for Principal Officer review.");
            store.save(ctx);
            return ctx;
        });
    }

    /**
     * Read-only review summary for Principal Officer — shaped from existing summary endpoint.
     */
    @GetMapping("/{caseId}/review-summary")
    public ResponseEntity<?> getReviewSummary(@PathVariable String caseId) {
        InvestigationContext ctx = getOrSeedContext(caseId, "AWAITING_LEGAL_REVIEW");

        long unreviewed = ctx.getNodes().stream()
            .filter(n -> n.getOfficerVerdict() != null &&
                "UNREVIEWED".equals(n.getOfficerVerdict().name()))
            .count();

        List<Map<String, Object>> nodeSummaries = ctx.getNodes().stream().map(n -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("nodeId", n.getNodeId());
            m.put("label", n.getLabel() != null ? n.getLabel() : "");
            m.put("nodeType", n.getNodeType() != null ? n.getNodeType() : "");
            m.put("officerVerdict", n.getOfficerVerdict() != null ? n.getOfficerVerdict().name() : "UNREVIEWED");
            m.put("nodeAction", n.getNodeAction() != null ? n.getNodeAction().name() : "NO_ACTION");
            m.put("aiClassification", n.getAiAnalysis() != null ? n.getAiAnalysis().aiClassification().name() : "UNCLASSIFIED");
            m.put("confidence", n.getAiAnalysis() != null ? n.getAiAnalysis().confidence() : 0.0);
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("caseId", ctx.getCaseId());
        result.put("caseStatus", ctx.getCaseStatus() != null ? ctx.getCaseStatus() : "");
        result.put("snapshot", ctx.getSnapshot());
        result.put("recommendation", ctx.getRecommendation() != null ? ctx.getRecommendation() : Map.of());
        result.put("nodeCount", ctx.getNodes().size());
        result.put("unreviewedNodes", unreviewed);
        result.put("evidenceCount", ctx.getEvidenceRepository().size());
        result.put("timeline", ctx.getTimeline());
        result.put("caseNotes", ctx.getCaseNotes());
        result.put("strDraft", ctx.getStrDraft() != null ? ctx.getStrDraft() : Map.of());
        result.put("nodes", nodeSummaries);
        return ResponseEntity.ok(result);
    }

    /**
     * Queue of cases awaiting Principal Officer review.
     */
    @GetMapping("/review-queue")
    public ResponseEntity<List<Map<String, Object>>> getReviewQueue() {
        // In a real system this would query a DB; here we can't enumerate the store
        // so we return an empty list — the frontend fetches individual cases by ID from AppContextSimplified
        return ResponseEntity.ok(List.of());
    }

    /**
     * Generate AI-assisted STR draft narrative.
     */
    @PostMapping("/{caseId}/str-draft")
    public ResponseEntity<?> generateStrDraft(@PathVariable String caseId) {
        try {
            StrDraft draft = strDraftService.generateDraft(caseId);
            return ResponseEntity.ok(draft);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(503).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Officer-edited STR narrative — sets officerEdited: true.
     */
    @PutMapping("/{caseId}/str-draft")
    public ResponseEntity<?> updateStrDraft(
            @PathVariable String caseId,
            @RequestBody Map<String, String> body) {
        try {
            String narrative = body.get("narrative");
            if (narrative == null || narrative.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "narrative is required"));
            }
            StrDraft updated = strDraftService.updateDraft(caseId, narrative);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Principal Officer decision: APPROVE | RETURN | REJECT | NEED_MORE_EVIDENCE
     */
    @PostMapping("/{caseId}/decision")
    public ResponseEntity<Map<String, String>> makeDecision(
            @PathVariable String caseId,
            @RequestBody PrincipalDecisionRequest request) {

        InvestigationContext ctx = getOrSeedContext(caseId, "AWAITING_LEGAL_REVIEW");

        String currentStatus = ctx.getCaseStatus();
        String actor = "Principal Officer";

        String targetStatus = switch (request.decision()) {
            case "APPROVE" -> "RESTRICTION_ACTIVE";
            case "RETURN", "NEED_MORE_EVIDENCE" -> "RETURNED_TO_AML";
            case "REJECT" -> "CLOSED_FALSE_POSITIVE";
            default -> null;
        };
        if (targetStatus == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid decision: " + request.decision()));
        }

        if (!statusMachine.isValidTransition(currentStatus, targetStatus)) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Illegal transition from " + currentStatus + " to " + targetStatus
            ));
        }

        ctx.setCaseStatus(targetStatus);

        String comment = request.comment() != null ? request.comment() : "";
        String reasonCode = request.decision();

        ctx.appendCaseNote(actor,
            "[" + reasonCode + "] " + (comment.isBlank() ? request.decision() : comment),
            java.time.Instant.now().toString());

        ctx.appendTimelineEntry("OFFICER_REVIEW", actor,
            "Principal Officer Decision: " + request.decision(),
            "Case " + request.decision().toLowerCase(Locale.ROOT).replace("_", " ") +
            (comment.isBlank() ? "" : ". Comment: " + comment));

        ctx.bumpVersion();
        store.save(ctx);

        return ResponseEntity.ok(Map.of("message", "Decision recorded: " + request.decision(), "newStatus", targetStatus));
    }
}
