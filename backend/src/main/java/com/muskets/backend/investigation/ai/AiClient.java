package com.muskets.backend.investigation.ai;

/**
 * Interface for swappable LLM provider integration.
 */
public interface AiClient {

    /**
     * Issues a prompt request to the AI client and returns the raw response.
     * Uses JSON mode by default for structured output.
     *
     * @param systemPrompt the system prompt defining agent persona and rules
     * @param userPrompt   the user payload (typically JSON context + comment)
     * @return the raw string response content from the AI
     * @throws Exception if connection or API fails
     */
    String call(String systemPrompt, String userPrompt) throws Exception;

    /**
     * Issues a plain-text prompt request (no JSON mode enforcement).
     * Used for STR narrative generation where the output should be natural language.
     *
     * @param systemPrompt the system prompt defining agent persona and rules
     * @param userPrompt   the user payload
     * @return the raw string response content from the AI
     * @throws Exception if connection or API fails
     */
    default String callPlainText(String systemPrompt, String userPrompt) throws Exception {
        return call(systemPrompt, userPrompt);
    }
}
