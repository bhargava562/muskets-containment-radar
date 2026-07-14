package com.muskets.backend.investigation.ai;

/**
 * Thrown when the daily AI call rate limit is exceeded.
 */
public class RateLimitExceededException extends RuntimeException {
    public RateLimitExceededException(String message) {
        super(message);
    }
}
