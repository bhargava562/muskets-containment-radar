package com.muskets.backend.investigation.dto.internal;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonAlias;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * The canonical object containing all state for a single investigation.
 *
 * <p>Held in-memory on the backend. Every update bumps the context version.
 * Masked when crossing the AI boundary. Included in the final audit trail.</p>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class InvestigationContext {

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
            "Reanalysis completed for node " + focusNodeId + " based on comments."
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
}
