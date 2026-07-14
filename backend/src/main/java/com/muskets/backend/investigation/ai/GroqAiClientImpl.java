package com.muskets.backend.investigation.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
 * Groq API implementation leveraging JSON mode format output.
 */
@Component
@ConditionalOnProperty(prefix = "app.ai", name = "provider", havingValue = "groq")
public class GroqAiClientImpl implements AiClient {

    private static final Logger log = LoggerFactory.getLogger(GroqAiClientImpl.class);
    private static final String ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

    private final InvestigationConfig config;
    private final MockAiEvaluator mockAiEvaluator;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GroqAiClientImpl(InvestigationConfig config, MockAiEvaluator mockAiEvaluator, ObjectMapper objectMapper) {
        this.config = config;
        this.mockAiEvaluator = mockAiEvaluator;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    @Override
    public String call(String systemPrompt, String userPrompt) throws Exception {
        String apiKey = config.getAi().getApiKey();
        if (apiKey == null || apiKey.isBlank() || "MOCK_KEY".equals(apiKey)) {
            log.info("No GROQ_API_KEY found. Executing mock Copilot evaluator fallback.");
            return mockAiEvaluator.generateMockResponse(userPrompt);
        }

        log.info("Sending reanalysis payload to Groq (model: {})", config.getAi().getModel());

        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", config.getAi().getModel()); // "llama-3.1-8b-instant" by default
        requestBody.put("temperature", 0.0);

        ObjectNode responseFormat = objectMapper.createObjectNode();
        responseFormat.put("type", "json_object");
        requestBody.set("response_format", responseFormat);

        ArrayNode messages = objectMapper.createArrayNode();
        messages.add(objectMapper.createObjectNode().put("role", "system").put("content", systemPrompt));
        messages.add(objectMapper.createObjectNode().put("role", "user").put("content", userPrompt));
        requestBody.set("messages", messages);

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(ENDPOINT))
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .timeout(Duration.ofSeconds(20))
            .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Groq API returned error HTTP {}: {}", response.statusCode(), response.body());
            throw new AiUnavailableException("Groq returned HTTP " + response.statusCode() + ": " + response.body());
        }

        return extractText(response.body());
    }

    /**
     * Groq uses the OpenAI-compatible response envelope: choices[0].message.content.
     */
    private String extractText(String rawBody) throws Exception {
        JsonNode root = objectMapper.readTree(rawBody);
        JsonNode choices = root.path("choices");

        if (!choices.isArray() || choices.isEmpty()) {
            throw new AiUnavailableException("Groq returned no choices");
        }

        String finishReason = choices.get(0).path("finish_reason").asText("");
        if (!finishReason.isEmpty() && !"stop".equals(finishReason)) {
            throw new AiUnavailableException("Groq finish_reason=" + finishReason + " — response incomplete");
        }

        String text = choices.get(0).path("message").path("content").asText(null);
        if (text == null || text.isBlank()) {
            throw new AiUnavailableException("Groq returned an empty message");
        }

        return text.trim();
    }
}
