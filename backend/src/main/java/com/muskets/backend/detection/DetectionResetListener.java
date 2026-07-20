package com.muskets.backend.detection;

import com.muskets.backend.detection.engine.PreFlaggerEngine;
import com.muskets.backend.detection.engine.PostOperatorEngine;
import com.muskets.backend.shared.events.SystemResetEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Listener within the detection package that handles system reset events.
 * 
 * <p>Since it resides inside the {@code detection} package, it can safely import
 * and access the internal {@link PreFlaggerEngine} and {@link PostOperatorEngine}
 * classes without breaking any ArchUnit boundary checks.</p>
 */
@Component
public class DetectionResetListener {

    private static final Logger log = LoggerFactory.getLogger(DetectionResetListener.class);

    private final PreFlaggerEngine preFlagger;
    private final PostOperatorEngine postOperator;

    public DetectionResetListener(PreFlaggerEngine preFlagger, PostOperatorEngine postOperator) {
        this.preFlagger = preFlagger;
        this.postOperator = postOperator;
    }

    /**
     * Resets detection engine states when a SystemResetEvent is published.
     */
    @EventListener
    public void onSystemReset(SystemResetEvent event) {
        log.info("SystemResetEvent received. Resetting detection engine states...");
        preFlagger.reset();
        postOperator.reset();
    }
}
