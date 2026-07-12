package com.muskets.backend.investigation.service;

import com.muskets.backend.investigation.dto.internal.*;
import com.muskets.backend.investigation.store.InvestigationContextStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Service handling officer assessment reviews and node action updates.
 */
@Service
public class NodeReviewService {

    private static final Logger log = LoggerFactory.getLogger(NodeReviewService.class);

    private final InvestigationContextStore store;

    public NodeReviewService(InvestigationContextStore store) {
        this.store = store;
    }

    /**
     * Updates the officer verdict on a specific node.
     */
    public void updateVerdict(String caseId, String nodeId, OfficerVerdict verdict) {
        log.info("Updating verdict for case {}, node {} to {}", caseId, nodeId, verdict);

        InvestigationContext context = store.get(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        InvestigationNode node = context.getNodes().stream()
            .filter(n -> n.getNodeId().equals(nodeId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Node not found: " + nodeId));

        node.setOfficerVerdict(verdict);
        context.appendTimelineEntry(
            "OFFICER_REVIEW",
            "AML Officer",
            "Node Verdict Updated",
            "Officer marked node " + nodeId + " (" + node.getKyc().customerName() + ") as " + verdict
        );
        context.bumpVersion();
        store.save(context);
    }

    /**
     * Updates the containment action recommendation for a specific node.
     */
    public void updateNodeAction(String caseId, String nodeId, NodeAction action) {
        log.info("Updating action recommendation for case {}, node {} to {}", caseId, nodeId, action);

        InvestigationContext context = store.get(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        InvestigationNode node = context.getNodes().stream()
            .filter(n -> n.getNodeId().equals(nodeId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Node not found: " + nodeId));

        node.setNodeAction(action);
        context.appendTimelineEntry(
            "OFFICER_REVIEW",
            "AML Officer",
            "Containment Action Updated",
            "Officer recommended action " + action + " for account " + node.getAccountId()
        );
        context.bumpVersion();
        store.save(context);
    }
}
