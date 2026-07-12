package com.muskets.backend.detection;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Externalized detection thresholds — tunable via {@code application.yaml}
 * or environment variables without code changes.
 *
 * <p>All values have sensible defaults grounded in the CSV dataset analysis
 * and RBI/FATF benchmarks (see {@code docs/03-RESEARCH-EVIDENCE.md}).</p>
 */
@Configuration
@ConfigurationProperties(prefix = "detection.threshold")
public class DetectionConfig {

    private double zScore = 3.0;
    private int negativeStreak = 5;
    private long velocityWindowSeconds = 60;
    private int velocityCount = 5;
    private double p1Score = 8.0;
    private double p2Score = 5.0;
    private int accountAgeRiskDays = 30;

    // --- Getters and Setters (required by @ConfigurationProperties) ---

    public double getZScore()                       { return zScore; }
    public void setZScore(double zScore)            { this.zScore = zScore; }

    public int getNegativeStreak()                  { return negativeStreak; }
    public void setNegativeStreak(int n)            { this.negativeStreak = n; }

    public long getVelocityWindowSeconds()          { return velocityWindowSeconds; }
    public void setVelocityWindowSeconds(long v)    { this.velocityWindowSeconds = v; }

    public int getVelocityCount()                   { return velocityCount; }
    public void setVelocityCount(int v)             { this.velocityCount = v; }

    public double getP1Score()                      { return p1Score; }
    public void setP1Score(double s)                { this.p1Score = s; }

    public double getP2Score()                      { return p2Score; }
    public void setP2Score(double s)                { this.p2Score = s; }

    public int getAccountAgeRiskDays()              { return accountAgeRiskDays; }
    public void setAccountAgeRiskDays(int d)        { this.accountAgeRiskDays = d; }
}
