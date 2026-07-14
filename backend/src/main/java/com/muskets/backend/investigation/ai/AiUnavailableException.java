package com.muskets.backend.investigation.ai;

/**
 * Thrown when the AI client fails to call the API or the response is empty/blocked.
 */
public class AiUnavailableException extends Exception {
    public AiUnavailableException(String message) {
        super(message);
    }
}
