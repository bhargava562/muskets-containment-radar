package com.muskets.backend.shared.events;

/**
 * The sole outward-facing contract of the detection module.
 *
 * <p>This class lives in {@code shared.events} — outside the {@code detection/}
 * package — so that it survives even if the entire detection module is deleted.
 * Nothing outside {@code detection/} may import any class from inside it; this
 * event is the only communication channel.</p>
 *
 * <p>Immutable data holder. No logic.</p>
 */
public class MuleFlaggedEvent {

    private final String accountId;
    private final String priority;      // "P1", "P2", "P3"
    private final double riskScore;
    private final String triggerReason;  // human-readable, e.g. "NEGATIVE_BALANCE_STREAK | Z_SCORE_ANOMALY"
    private final long timestamp;

    public MuleFlaggedEvent(String accountId, String priority, double riskScore,
                            String triggerReason, long timestamp) {
        this.accountId = accountId;
        this.priority = priority;
        this.riskScore = riskScore;
        this.triggerReason = triggerReason;
        this.timestamp = timestamp;
    }

    public String getAccountId()    { return accountId; }
    public String getPriority()     { return priority; }
    public double getRiskScore()    { return riskScore; }
    public String getTriggerReason(){ return triggerReason; }
    public long getTimestamp()      { return timestamp; }

    @Override
    public String toString() {
        return "MuleFlaggedEvent{" +
                "accountId='" + accountId + '\'' +
                ", priority='" + priority + '\'' +
                ", riskScore=" + riskScore +
                ", triggerReason='" + triggerReason + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}
