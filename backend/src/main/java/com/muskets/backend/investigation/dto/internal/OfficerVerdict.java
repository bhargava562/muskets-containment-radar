package com.muskets.backend.investigation.dto.internal;

/**
 * Officer's independent assessment of the AI's classification for a node.
 *
 * <p>This is deliberately distinct from {@link AiClassification} —
 * "CONFIRMED" here means "I agree with the AI," not "the AI said confirmed."</p>
 */
public enum OfficerVerdict {
    UNREVIEWED,
    CONFIRMED,
    DISPUTED,
    CLEARED,
    NEEDS_MORE_EVIDENCE
}
