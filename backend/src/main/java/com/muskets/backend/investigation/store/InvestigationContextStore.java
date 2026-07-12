package com.muskets.backend.investigation.store;

import com.muskets.backend.investigation.dto.internal.InvestigationContext;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory store for investigation contexts.
 *
 * <p>Uses a {@link ConcurrentHashMap} for hackathon-scale storage.
 * Easily swappable for database persistence (PostgreSQL/JPA) later.</p>
 */
@Component
public class InvestigationContextStore {

    private final Map<String, InvestigationContext> contexts = new ConcurrentHashMap<>();

    public void save(InvestigationContext context) {
        if (context != null && context.getCaseId() != null) {
            contexts.put(context.getCaseId(), context);
        }
    }

    public Optional<InvestigationContext> get(String caseId) {
        if (caseId == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(contexts.get(caseId));
    }

    public boolean exists(String caseId) {
        return caseId != null && contexts.containsKey(caseId);
    }

    public void remove(String caseId) {
        if (caseId != null) {
            contexts.remove(caseId);
        }
    }

    public void clear() {
        contexts.clear();
    }
}
