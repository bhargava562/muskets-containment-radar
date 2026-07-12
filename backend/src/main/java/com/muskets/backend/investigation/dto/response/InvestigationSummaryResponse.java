package com.muskets.backend.investigation.dto.response;

import com.muskets.backend.investigation.dto.internal.CaseNote;
import com.muskets.backend.investigation.dto.internal.TimelineEntry;

import java.util.List;

/**
 * Audit-ready summary report containing all evidence and decisions.
 */
public record InvestigationSummaryResponse(
    String caseId,
    String recommendingOfficer,
    String finalAction,
    String rationale,
    List<NodeSummaryInfo> nodes,
    List<TimelineEntry> timeline,
    List<CaseNote> caseNotes,
    String reportTimestamp
) {
    public record NodeSummaryInfo(
        String nodeId,
        String label,
        String nodeType,
        String officerVerdict,
        String nodeAction,
        String aiClassification,
        double confidence
    ) {}
}
