package com.muskets.backend.investigation.ai;

/**
 * Interface for swappable LLM provider integration.
 */
public interface AiClient {

    /**
     * Issues a prompt request to the AI client and returns the raw response.
     *
     * @param systemPrompt the system prompt defining agent persona and rules
     * @param userPrompt   the user payload (typically JSON context + comment)
     * @return the raw string response content from the AI
     * @throws Exception if connection or API fails
     */
    String call(String systemPrompt, String userPrompt) throws Exception;
}
