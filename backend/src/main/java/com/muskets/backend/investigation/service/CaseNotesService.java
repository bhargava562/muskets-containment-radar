package com.muskets.backend.investigation.service;

import com.muskets.backend.investigation.dto.internal.InvestigationContext;
import com.muskets.backend.investigation.store.InvestigationContextStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Service to manage human case annotations.
 */
@Service
public class CaseNotesService {

    private static final Logger log = LoggerFactory.getLogger(CaseNotesService.class);

    private final InvestigationContextStore store;

    public CaseNotesService(InvestigationContextStore store) {
        this.store = store;
    }

    /**
     * Appends a new human case note annotation.
     */
    public void appendNote(String caseId, String author, String content) {
        log.info("Appending case note by {} for case {}", author, caseId);

        InvestigationContext context = store.get(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        context.appendCaseNote(author, content, Instant.now().toString());
        store.save(context);
    }
}
