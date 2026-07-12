package com.muskets.backend.investigation.service;

import com.muskets.backend.investigation.dto.internal.EvidenceItem;
import com.muskets.backend.investigation.dto.internal.InvestigationContext;
import com.muskets.backend.investigation.store.InvestigationContextStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.UUID;

/**
 * Service managing case evidence uploads and metadata logging.
 */
@Service
public class EvidenceService {

    private static final Logger log = LoggerFactory.getLogger(EvidenceService.class);

    private final InvestigationContextStore store;

    public EvidenceService(InvestigationContextStore store) {
        this.store = store;
    }

    /**
     * Registers a new evidence upload.
     * Note: actual bytes are discarded, only metadata is logged for the audit trail.
     */
    public void registerEvidence(String caseId, String fileName, long fileSize, String uploadedBy) {
        log.info("Registering evidence file {} ({}) for case {}", fileName, fileSize, caseId);

        InvestigationContext context = store.get(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        if (context.getEvidenceRepository() == null) {
            context.setEvidenceRepository(new ArrayList<>());
        }

        String evidenceId = "evd_" + UUID.randomUUID().toString().substring(0, 8);
        EvidenceItem item = new EvidenceItem(
            evidenceId,
            fileName,
            uploadedBy,
            Instant.now().toString(),
            fileSize
        );

        context.getEvidenceRepository().add(item);
        context.appendTimelineEntry(
            "EVIDENCE_UPLOAD",
            uploadedBy,
            "Evidence File Uploaded",
            "Uploaded file " + fileName + " (" + (fileSize / 1024) + " KB) to case repository."
        );
        context.bumpVersion();
        store.save(context);
    }
}
