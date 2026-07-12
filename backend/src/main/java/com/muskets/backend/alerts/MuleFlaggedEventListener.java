package com.muskets.backend.alerts;

import com.muskets.backend.shared.events.MuleFlaggedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Listens for {@link MuleFlaggedEvent}s and exposes them via REST.
 *
 * <p><b>Module boundary proof:</b> this class has <b>zero imports</b> from
 * {@code com.muskets.backend.detection}. It only knows about the shared
 * event envelope. If the entire {@code detection/} package is deleted,
 * this class continues to compile — it just stops receiving new events.</p>
 */
@RestController
@RequestMapping("/api/alerts")
public class MuleFlaggedEventListener {

    private static final Logger log = LoggerFactory.getLogger(MuleFlaggedEventListener.class);

    private final List<MuleFlaggedEvent> recentAlerts = new CopyOnWriteArrayList<>();
    private final AlertLogRepository alertLogRepository;

    public MuleFlaggedEventListener(AlertLogRepository alertLogRepository) {
        this.alertLogRepository = alertLogRepository;
    }

    /**
     * Spring application event listener — fires every time the detection
     * module publishes a MuleFlaggedEvent.
     */
    @EventListener
    public void onMuleFlagged(MuleFlaggedEvent event) {
        log.info("Alert received: {}", event);

        // In-memory list for fast REST access
        recentAlerts.add(event);

        // Persist to H2 for durability across restarts
        alertLogRepository.save(new AlertLogEntity(
                event.getAccountId(),
                event.getPriority(),
                event.getRiskScore(),
                event.getTriggerReason(),
                event.getTimestamp()
        ));
    }

    /**
     * Return all alerts from this session (in-memory).
     */
    @GetMapping
    public List<MuleFlaggedEvent> getAllAlerts() {
        return recentAlerts;
    }

    public void clearAlerts() {
        recentAlerts.clear();
    }

    /**
     * Return alert count.
     */
    @GetMapping("/count")
    public Map<String, Object> getAlertCount() {
        return Map.of(
                "total", recentAlerts.size(),
                "p1", recentAlerts.stream().filter(a -> "P1".equals(a.getPriority())).count(),
                "p2", recentAlerts.stream().filter(a -> "P2".equals(a.getPriority())).count(),
                "persisted", alertLogRepository.count()
        );
    }

    /**
     * Return all persisted alerts (survives container restart).
     */
    @GetMapping("/persisted")
    public List<AlertLogEntity> getPersistedAlerts() {
        return alertLogRepository.findAll();
    }
}
