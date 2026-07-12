package com.muskets.backend.investigation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.muskets.backend.investigation.dto.internal.InvestigationContext;
import com.muskets.backend.investigation.dto.internal.CaseSnapshot;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.Optional;

/**
 * Service to load and build investigation contexts from seed templates.
 */
@Service
public class CaseContextBuilder {

    private static final Logger log = LoggerFactory.getLogger(CaseContextBuilder.class);

    private final ObjectMapper objectMapper;
    private final ResourceLoader resourceLoader;

    public CaseContextBuilder(ObjectMapper objectMapper, ResourceLoader resourceLoader) {
        this.objectMapper = objectMapper;
        this.resourceLoader = resourceLoader;
    }

    /**
     * Loads a seed file from the classpath resources and parses it into an
     * {@link InvestigationContext}.
     *
     * @param caseId the ID of the case (maps to filename case-[caseId].seed.json)
     * @return the parsed investigation context, or empty if load fails
     */
    public Optional<InvestigationContext> loadSeedContext(String caseId) {
        String filename = caseId.startsWith("case-") ? caseId : "case-" + caseId;
        String resourcePath = "classpath:seed/" + filename + ".seed.json";
        log.info("Loading seed context from {}", resourcePath);

        try {
            Resource resource = resourceLoader.getResource(resourcePath);
            if (!resource.exists()) {
                log.warn("Seed resource does not exist: {}", resourcePath);
                return Optional.empty();
            }

            try (InputStream inputStream = resource.getInputStream()) {
                InvestigationContext context = objectMapper.readValue(inputStream, InvestigationContext.class);
                
                // Strip "case-" prefix if present to match frontend case mapping IDs
                String cleanCaseId = caseId.startsWith("case-") ? caseId.substring(5) : caseId;
                context.setCaseId(cleanCaseId);
                
                if (context.getSnapshot() != null) {
                    CaseSnapshot oldSnap = context.getSnapshot();
                    CaseSnapshot newSnap = new CaseSnapshot(
                        cleanCaseId,
                        oldSnap.accountId(),
                        oldSnap.customerName(),
                        oldSnap.priority(),
                        oldSnap.riskAmount(),
                        oldSnap.tracedAmount(),
                        oldSnap.totalBalance(),
                        oldSnap.triggerReason(),
                        oldSnap.generatedAt(),
                        oldSnap.status()
                    );
                    context.setSnapshot(newSnap);
                }

                log.info("Successfully loaded seed context for case: {}, version: {}", 
                         context.getCaseId(), context.getContextVersion());
                return Optional.of(context);
            }
        } catch (Exception e) {
            log.error("Failed to load/parse seed context for case {}", caseId, e);
            return Optional.empty();
        }
    }
}
