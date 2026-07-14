package com.muskets.backend.investigation.branch;

import com.muskets.backend.investigation.dto.internal.ExecutionRecord;
import com.muskets.backend.investigation.dto.internal.InvestigationContext;
import com.muskets.backend.investigation.dto.request.ExecutionUpdateRequest;
import com.muskets.backend.investigation.service.InvestigationStatusMachine;
import com.muskets.backend.investigation.store.InvestigationContextStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/investigation")
public class BranchExecutionController {

    private final InvestigationContextStore store;
    private final InvestigationStatusMachine statusMachine;

    public BranchExecutionController(InvestigationContextStore store, InvestigationStatusMachine statusMachine) {
        this.store = store;
        this.statusMachine = statusMachine;
    }

    /**
     * Log a branch execution action. If action is RESTRICTION_APPLIED, transitions case to RESOLVED.
     */
    @PostMapping("/{caseId}/execution")
    public ResponseEntity<Map<String, String>> logExecution(
            @PathVariable String caseId,
            @RequestBody ExecutionUpdateRequest request) {

        InvestigationContext ctx = store.get(caseId).orElse(null);
        if (ctx == null) return ResponseEntity.notFound().build();

        String currentStatus = ctx.getCaseStatus();
        if (!"RESTRICTION_ACTIVE".equals(currentStatus)) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Execution actions only allowed on RESTRICTION_ACTIVE cases, current: " + currentStatus
            ));
        }

        if (ctx.getExecutionLog() == null) ctx.setExecutionLog(new ArrayList<>());

        ExecutionRecord record = new ExecutionRecord(
            "exec_" + UUID.randomUUID().toString().substring(0, 8),
            request.action(),
            request.note() != null ? request.note() : "",
            "Branch Manager",
            Instant.now().toString()
        );
        ctx.getExecutionLog().add(record);

        ctx.appendTimelineEntry("OFFICER_REVIEW", "Branch Manager",
            "Branch Action: " + request.action(),
            request.note() != null ? request.note() : request.action());

        if ("RESTRICTION_APPLIED".equals(request.action())) {
            if (!statusMachine.isValidTransition(currentStatus, "RESOLVED")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot transition to RESOLVED from " + currentStatus));
            }
            ctx.setCaseStatus("RESOLVED");
            ctx.appendTimelineEntry("OFFICER_REVIEW", "Branch Manager",
                "Case Resolved", "Branch Manager applied restriction. Case closed.");
        }

        ctx.bumpVersion();
        store.save(ctx);

        return ResponseEntity.ok(Map.of(
            "message", "Execution record logged",
            "action", request.action(),
            "caseStatus", ctx.getCaseStatus()
        ));
    }
}
