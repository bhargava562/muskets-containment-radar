package com.muskets.backend.investigation.controller;

import com.muskets.backend.investigation.dto.request.AddCaseNoteRequest;
import com.muskets.backend.investigation.service.CaseNotesService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller exposing endpoints to append human case notes.
 */
@RestController
@RequestMapping("/api/investigation")
public class CaseNotesController {

    private final CaseNotesService caseNotesService;

    public CaseNotesController(CaseNotesService caseNotesService) {
        this.caseNotesService = caseNotesService;
    }

    /**
     * Appends a new case note (human annotation).
     */
    @PostMapping("/{caseId}/notes")
    public ResponseEntity<Map<String, String>> addCaseNote(
            @PathVariable String caseId,
            @RequestBody AddCaseNoteRequest request,
            @RequestHeader(value = "X-Officer-Id", defaultValue = "EMP-902") String officerId) {
        try {
            if (request.content() == null || request.content().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Case note content cannot be empty"));
            }

            caseNotesService.appendNote(caseId, officerId, request.content());
            return ResponseEntity.ok(Map.of("message", "Case note appended successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
