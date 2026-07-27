package com.muskets.backend.investigation.dto.internal;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonAlias;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * The canonical object containing all state for a single investigation.
 *
 * <p>Held in-memory on the backend. Every update bumps the context version.
 * Masked when crossing the AI boundary. Included in the final audit trail.</p>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class InvestigationContext {

    private static final Logger log = LoggerFactory.getLogger(InvestigationContext.class);

    private String caseId;
    private int contextVersion;
    private CaseSnapshot snapshot;
    private List<InvestigationNode> nodes = new ArrayList<>();
    private List<GraphEdge> edges = new ArrayList<>();
    private List<TimelineEntry> timeline = new ArrayList<>();
    private List<CaseNote> caseNotes = new ArrayList<>();
    private List<EvidenceItem> evidenceRepository = new ArrayList<>();

    @JsonAlias("aiRevisionHistory")
    private List<AiRevision> revisionHistory = new ArrayList<>();
    private OfficerRecommendation recommendation;
    private String caseStatus;
    private StrDraft strDraft;
    private List<ExecutionRecord> executionLog = new ArrayList<>();
    private boolean aiGenerating;
    private AiResponseMetadata aiResponseMetadata;
    private InvestigationCoverage investigationCoverage;
    private ExpandPreview expandPreview;

    public InvestigationContext() {
        this.contextVersion = 1;
    }

    // --- Helper Mutation Methods ---

    public void bumpVersion() {
        this.contextVersion++;
    }

    public void appendCaseNote(String author, String content, String timestamp) {
        String noteId = "note_" + UUID.randomUUID().toString().substring(0, 8);
        CaseNote note = new CaseNote(noteId, author, content, timestamp);
        if (this.caseNotes == null) {
            this.caseNotes = new ArrayList<>();
        }
        this.caseNotes.add(note);
        appendTimelineEntry(
            "OFFICER_REVIEW",
            author,
            "Case Note Added",
            "Officer " + author + " added a case note."
        );
        bumpVersion();
    }

    public void appendTimelineEntry(String category, String actor, String title, String description) {
        if (this.timeline == null) {
            this.timeline = new ArrayList<>();
        }
        String eventId = "evt_" + UUID.randomUUID().toString().substring(0, 8);
        this.timeline.add(new TimelineEntry(
            eventId,
            Instant.now().toString(),
            title,
            description,
            category,
            actor
        ));
    }

    public void applyAiRevision(List<AiSchemaContract> revisions, String focusNodeId, String comment, String timestamp) {
        // Promote hidden preview nodes if AI returned classifications for them
        if (this.expandPreview != null && this.expandPreview.nodes() != null) {
            Set<String> activeNodeIds = this.nodes.stream()
                .map(InvestigationNode::getNodeId)
                .collect(Collectors.toSet());

            Set<String> nodesToPromote = new HashSet<>();
            for (AiSchemaContract revision : revisions) {
                if (!activeNodeIds.contains(revision.nodeId())) {
                    nodesToPromote.add(revision.nodeId());
                }
            }

            // Expand nodesToPromote transitively so no connected edge has a missing target node
            boolean expanded = true;
            while (expanded) {
                expanded = false;
                if (this.expandPreview.edges() != null) {
                    for (GraphEdge pEdge : this.expandPreview.edges()) {
                        if (nodesToPromote.contains(pEdge.fromNodeId()) || nodesToPromote.contains(pEdge.toNodeId())) {
                            if (!activeNodeIds.contains(pEdge.fromNodeId()) && nodesToPromote.add(pEdge.fromNodeId())) {
                                expanded = true;
                            }
                            if (!activeNodeIds.contains(pEdge.toNodeId()) && nodesToPromote.add(pEdge.toNodeId())) {
                                expanded = true;
                            }
                        }
                    }
                }
            }

            for (String pId : nodesToPromote) {
                for (InvestigationNode pNode : this.expandPreview.nodes()) {
                    if (pNode.getNodeId().equals(pId) && this.nodes.stream().noneMatch(n -> n.getNodeId().equals(pId))) {
                        log.info("Promoting hidden node {} ({}) into active graph context", pNode.getNodeId(), pNode.getLabel());
                        this.nodes.add(pNode);

                        // Update investigationCoverage
                        if (this.investigationCoverage != null) {
                            List<String> unreviewed = new ArrayList<>(this.investigationCoverage.unreviewedNodeIds());
                            if (!unreviewed.contains(pNode.getNodeId())) {
                                unreviewed.add(pNode.getNodeId());
                            }
                            this.investigationCoverage = new InvestigationCoverage(
                                this.nodes.size(),
                                this.investigationCoverage.reviewedNodes(),
                                unreviewed,
                                this.investigationCoverage.expandableNodeIds()
                            );
                        }

                        appendTimelineEntry(
                            "AI_REANALYSIS",
                            "AI Copilot",
                            "Network Scope Expanded: Hidden Node Revealed",
                            "Copilot identified unlisted counterparty transaction in logs and revealed hidden node " + pNode.getNodeId() + " (" + pNode.getLabel() + ")."
                        );
                        break;
                    }
                }
            }

            // Copy all connected edges from expandPreview whose endpoints exist in active nodes
            if (this.expandPreview.edges() != null) {
                Set<String> currentNodes = this.nodes.stream().map(InvestigationNode::getNodeId).collect(Collectors.toSet());
                for (GraphEdge pEdge : this.expandPreview.edges()) {
                    if (currentNodes.contains(pEdge.fromNodeId()) && currentNodes.contains(pEdge.toNodeId())) {
                        boolean edgeExists = this.edges.stream().anyMatch(e ->
                            e.fromNodeId().equals(pEdge.fromNodeId()) && e.toNodeId().equals(pEdge.toNodeId()));
                        if (!edgeExists) {
                            this.edges.add(pEdge);
                        }
                    }
                }
            }
        }

        // Apply classification and evidence claim updates to matching nodes
        for (AiSchemaContract revision : revisions) {
            for (InvestigationNode node : this.nodes) {
                if (node.getNodeId().equals(revision.nodeId())) {
                    // Map classification string to enum
                    AiClassification classification = AiClassification.valueOf(revision.aiClassification());
                    
                    AiAnalysis updatedAnalysis = new AiAnalysis(
                        classification,
                        revision.confidence(),
                        revision.evidence(),
                        revision.recommendedAction(),
                        "Analysis updated by Copilot re-evaluation based on officer feedback."
                    );
                    node.setAiAnalysis(updatedAnalysis);
                    break;
                }
            }
        }

        // Record in revision history
        if (this.revisionHistory == null) {
            this.revisionHistory = new ArrayList<>();
        }
        this.revisionHistory.add(new AiRevision(
            this.contextVersion,
            timestamp,
            focusNodeId,
            comment,
            revisions
        ));

        appendTimelineEntry(
            "AI_REANALYSIS",
            "AI Copilot",
            "AI Copilot Reanalysis Complete",
            "Reanalysis completed for node " + (focusNodeId != null ? focusNodeId : "network") + " based on officer feedback."
        );
        bumpVersion();
    }

    // --- Getters & Setters ---

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public int getContextVersion() { return contextVersion; }
    public void setContextVersion(int contextVersion) { this.contextVersion = contextVersion; }

    public CaseSnapshot getSnapshot() { return snapshot; }
    public void setSnapshot(CaseSnapshot snapshot) { this.snapshot = snapshot; }

    public List<InvestigationNode> getNodes() { return nodes; }
    public void setNodes(List<InvestigationNode> nodes) { this.nodes = nodes; }

    public List<GraphEdge> getEdges() { return edges; }
    public void setEdges(List<GraphEdge> edges) { this.edges = edges; }

    public List<TimelineEntry> getTimeline() { return timeline; }
    public void setTimeline(List<TimelineEntry> timeline) { this.timeline = timeline; }

    public List<CaseNote> getCaseNotes() { return caseNotes; }
    public void setCaseNotes(List<CaseNote> caseNotes) { this.caseNotes = caseNotes; }

    public List<EvidenceItem> getEvidenceRepository() { return evidenceRepository; }
    public void setEvidenceRepository(List<EvidenceItem> evidenceRepository) { this.evidenceRepository = evidenceRepository; }

    public List<AiRevision> getRevisionHistory() { return revisionHistory; }
    public void setRevisionHistory(List<AiRevision> revisionHistory) { this.revisionHistory = revisionHistory; }

    public OfficerRecommendation getRecommendation() { return recommendation; }
    public void setRecommendation(OfficerRecommendation recommendation) { this.recommendation = recommendation; }

    public String getCaseStatus() { return caseStatus; }
    public void setCaseStatus(String caseStatus) { this.caseStatus = caseStatus; }

    public boolean isAiGenerating() { return aiGenerating; }
    public void setAiGenerating(boolean aiGenerating) { this.aiGenerating = aiGenerating; }

    public AiResponseMetadata getAiResponseMetadata() { return aiResponseMetadata; }
    public void setAiResponseMetadata(AiResponseMetadata aiResponseMetadata) { this.aiResponseMetadata = aiResponseMetadata; }

    public StrDraft getStrDraft() { return strDraft; }
    public void setStrDraft(StrDraft strDraft) { this.strDraft = strDraft; }

    public List<ExecutionRecord> getExecutionLog() { return executionLog; }
    public void setExecutionLog(List<ExecutionRecord> executionLog) { this.executionLog = executionLog; }

    public InvestigationCoverage getInvestigationCoverage() { return investigationCoverage; }
    public void setInvestigationCoverage(InvestigationCoverage investigationCoverage) { this.investigationCoverage = investigationCoverage; }

    public ExpandPreview getExpandPreview() { return expandPreview; }
    public void setExpandPreview(ExpandPreview expandPreview) { this.expandPreview = expandPreview; }
}
