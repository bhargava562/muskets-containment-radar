package com.muskets.backend.investigation.dto.internal;

/**
 * A case-level note written by an officer.
 *
 * <p>Case notes are human-to-human annotations: "Customer contacted branch on 12-Jul,"
 * "Awaiting CCTV footage from Coimbatore branch." They are:</p>
 * <ul>
 *   <li><b>Never</b> sent to the LLM (excluded from {@link MaskedGraphPayload})</li>
 *   <li>Included in the investigation summary for audit trail</li>
 *   <li>Timestamped and attributed to the authoring officer</li>
 * </ul>
 *
 * <p>This is deliberately distinct from the AI review comment in
 * {@code ReanalyzeRequest.officerComment}, which <i>is</i> sent to the LLM.</p>
 */
public record CaseNote(
    String noteId,
    String author,       // officer's employee ID
    String content,
    String timestamp     // ISO-8601
) {}
