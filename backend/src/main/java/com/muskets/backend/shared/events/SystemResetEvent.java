package com.muskets.backend.shared.events;

/**
 * Event published to signal a system-wide reset.
 * 
 * <p>Lives in the {@code shared.events} package so that components outside the
 * {@code detection} module can trigger a reset without direct reference to
 * detection internals, keeping the modules decoupled.</p>
 */
public class SystemResetEvent {
    // No fields required — this is a simple signal event
}
