package com.muskets.backend.investigation.dto.internal;

/**
 * Officer's containment recommendation for a specific node.
 *
 * <p>This is the second dimension of per-node state (alongside
 * {@link OfficerVerdict}). A merchant node might be {@code CONFIRMED}
 * (AI is right, it's likely innocent) yet still carry {@code PARTIAL_LIEN}
 * because traced funds need to be held regardless of innocence.</p>
 */
public enum NodeAction {
    NO_ACTION,
    MONITOR,
    BRANCH_VERIFICATION,
    PARTIAL_LIEN,
    FULL_FREEZE,
    ESCALATE
}
