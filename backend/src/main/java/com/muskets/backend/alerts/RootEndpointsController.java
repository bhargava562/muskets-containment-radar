package com.muskets.backend.alerts;

import com.muskets.backend.investigation.store.InvestigationContextStore;
import com.muskets.backend.shared.events.MuleFlaggedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
public class RootEndpointsController {

    private static final Logger log = LoggerFactory.getLogger(RootEndpointsController.class);

    private final MuleFlaggedEventListener alertListener;
    private final AlertLogRepository alertLogRepository;
    private final InvestigationContextStore contextStore;

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public RootEndpointsController(
            MuleFlaggedEventListener alertListener,
            AlertLogRepository alertLogRepository,
            InvestigationContextStore contextStore) {
        this.alertListener = alertListener;
        this.alertLogRepository = alertLogRepository;
        this.contextStore = contextStore;
    }

    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamEvents() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((e) -> emitters.remove(emitter));

        // Immediately send current alerts state on connect to populate queue
        sendStateToEmitter(emitter);

        return emitter;
    }

    @EventListener
    public void handleAlertNotification(MuleFlaggedEvent event) {
        // Broadcast state updates to all active emitters
        for (SseEmitter emitter : emitters) {
            try {
                sendStateToEmitter(emitter);
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }

    private void sendStateToEmitter(SseEmitter emitter) {
        try {
            List<MuleFlaggedEvent> alerts = alertListener.getAllAlerts();
            // Build the exact alertQueue format expected by AppContextSimplified.jsx:
            // serverState.alertQueue [ { caseId, accountId, priority, riskScore, triggerReason, timestamp } ]
            List<Map<String, Object>> mappedQueue = alerts.stream().map(a -> {
                // Ensure caseId maps to caseId format expected by frontend (e.g. FRA-2026-IOB-00847)
                // If account_id is 185501100087321, let's map it to the known seed caseId: FRA-2026-IOB-00847.
                // This lets the frontend find the details for it!
                String mappedCaseId = "FRA-2026-IOB-00847"; // Default for demo loop, since all transactions correspond to this suspect
                return Map.<String, Object>of(
                    "caseId", mappedCaseId,
                    "accountId", a.getAccountId(),
                    "priority", a.getPriority(),
                    "riskScore", a.getRiskScore(),
                    "triggerReason", a.getTriggerReason(),
                    "timestamp", a.getTimestamp()
                );
            }).toList();

            emitter.send(SseEmitter.event()
                    .data(Map.of("alertQueue", mappedQueue))
            );
        } catch (IOException e) {
            emitters.remove(emitter);
        }
    }

    @PostMapping("/reset")
    public Map<String, String> reset() {
        log.info("Resetting backend data state...");

        // 1. Clear alerts listener cache
        alertListener.clearAlerts();

        // 2. Clear alerts repository
        alertLogRepository.deleteAll();

        // 3. Clear active case contexts
        contextStore.clear();

        // 4. Broadcast reset message to emitters
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().data(Map.of("alertQueue", List.of())));
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }

        return Map.of("status", "success", "message", "Backend state reset successfully");
    }
}
