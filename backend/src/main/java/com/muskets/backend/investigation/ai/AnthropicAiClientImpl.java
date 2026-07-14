package com.muskets.backend.investigation.ai;

import com.muskets.backend.investigation.InvestigationConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Anthropic Claude API implementation.
 *
 * <p>Uses standard JDK {@link HttpClient}. Falls back gracefully to a mock
 * deterministic evaluator if no {@code AI_API_KEY} is configured, ensuring
 * offline/hackathon reliability.</p>
 */
@Component
@ConditionalOnProperty(prefix = "app.ai", name = "provider", havingValue = "anthropic")
public class AnthropicAiClientImpl implements AiClient {

    private static final Logger log = LoggerFactory.getLogger(AnthropicAiClientImpl.class);

    private final InvestigationConfig config;
    private final MockAiEvaluator mockAiEvaluator;
    private final HttpClient httpClient;

    public AnthropicAiClientImpl(InvestigationConfig config, MockAiEvaluator mockAiEvaluator) {
        this.config = config;
        this.mockAiEvaluator = mockAiEvaluator;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    @Override
    public String call(String systemPrompt, String userPrompt) throws Exception {
        String apiKey = config.getAi().getApiKey();
        if (apiKey == null || apiKey.isBlank() || "MOCK_KEY".equals(apiKey)) {
            log.info("No AI_API_KEY found. Executing mock Copilot evaluator fallback.");
            return mockAiEvaluator.generateMockResponse(userPrompt);
        }

        log.info("Sending reanalysis payload to Anthropic (model: {})", config.getAi().getModel());

        String requestBody = """
            {
              "model": "%s",
              "system": "%s",
              "messages": [
                {"role": "user", "content": "%s"}
              ],
              "max_tokens": 1500,
              "temperature": 0.0
            }
            """.formatted(
                config.getAi().getModel(),
                escapeJson(systemPrompt),
                escapeJson(userPrompt)
            );

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.anthropic.com/v1/messages"))
            .header("x-api-key", apiKey)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Anthropic API returned error {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Anthropic API error: " + response.statusCode());
        }

        return extractContentFromResponse(response.body());
    }

    private String extractContentFromResponse(String responseBody) {
        try {
            int contentIdx = responseBody.indexOf("\"text\": \"");
            if (contentIdx == -1) return responseBody;
            int start = contentIdx + 9;
            int end = responseBody.indexOf("\"", start);
            return responseBody.substring(start, end).replace("\\n", "\n").replace("\\\"", "\"");
        } catch (Exception e) {
            return responseBody;
        }
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
