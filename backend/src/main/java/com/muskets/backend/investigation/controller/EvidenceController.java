package com.muskets.backend.investigation.controller;

import com.muskets.backend.investigation.service.EvidenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Controller exposing endpoints to upload evidence files.
 */
@RestController
@RequestMapping("/api/investigation")
public class EvidenceController {

    private final EvidenceService evidenceService;

    public EvidenceController(EvidenceService evidenceService) {
        this.evidenceService = evidenceService;
    }

    /**
     * Upload evidence file metadata for case audit log.
     */
    @PostMapping("/{caseId}/evidence")
    public ResponseEntity<Map<String, String>> uploadEvidence(
            @PathVariable String caseId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "uploadedBy", defaultValue = "EMP-902") String uploadedBy) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Empty file payload"));
            }
            
            evidenceService.registerEvidence(
                caseId, 
                file.getOriginalFilename(), 
                file.getSize(), 
                uploadedBy
            );
            
            return ResponseEntity.ok(Map.of("message", "Evidence item registered successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }
}
