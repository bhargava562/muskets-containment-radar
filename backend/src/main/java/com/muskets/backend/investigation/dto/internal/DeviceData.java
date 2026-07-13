package com.muskets.backend.investigation.dto.internal;

/**
 * Device and access profile for an investigation node.
 */
public record DeviceData(
    String lastLoginDevice,
    String lastLoginIp,
    String lastLoginLocation,
    String lastLoginTimestamp,
    int uniqueDevicesLast30Days,
    int uniqueIpsLast30Days,
    boolean vpnDetected,
    boolean rootedDeviceDetected,
    boolean simChanged,            // SIM card recently changed
    int failedLoginAttempts,       // failed logins in last 30 days
    String geoVelocityFlag         // "NONE", "MODERATE", "HIGH"
) {}
