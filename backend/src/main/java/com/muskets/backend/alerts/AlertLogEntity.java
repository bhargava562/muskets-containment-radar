package com.muskets.backend.alerts;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * JPA entity mapping to the {@code alert_log} table created by Flyway V1.
 *
 * <p>Persists every {@link com.muskets.backend.shared.events.MuleFlaggedEvent}
 * so alerts survive container restarts (H2 file-mode).</p>
 */
@Entity
@Table(name = "alert_log")
public class AlertLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_id", nullable = false, length = 128)
    private String accountId;

    @Column(name = "priority", nullable = false, length = 4)
    private String priority;

    @Column(name = "risk_score", nullable = false)
    private double riskScore;

    @Column(name = "trigger_reason", nullable = false, length = 512)
    private String triggerReason;

    @Column(name = "event_timestamp", nullable = false)
    private long eventTimestamp;

    @Column(name = "created_at")
    private Instant createdAt;

    protected AlertLogEntity() {} // JPA requires no-arg constructor

    public AlertLogEntity(String accountId, String priority, double riskScore,
                          String triggerReason, long eventTimestamp) {
        this.accountId = accountId;
        this.priority = priority;
        this.riskScore = riskScore;
        this.triggerReason = triggerReason;
        this.eventTimestamp = eventTimestamp;
        this.createdAt = Instant.now();
    }

    // --- Getters ---

    public Long getId()                 { return id; }
    public String getAccountId()        { return accountId; }
    public String getPriority()         { return priority; }
    public double getRiskScore()        { return riskScore; }
    public String getTriggerReason()    { return triggerReason; }
    public long getEventTimestamp()     { return eventTimestamp; }
    public Instant getCreatedAt()       { return createdAt; }
}
