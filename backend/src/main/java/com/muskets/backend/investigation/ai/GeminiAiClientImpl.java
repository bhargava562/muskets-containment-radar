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
 * Gemini API implementation leveraging native structured JSON schema enforcement.
 */
@Component
@ConditionalOnProperty(prefix = "app.ai", name = "provider", havingValue = "gemini")
public class GeminiAiClientImpl implements AiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiClientImpl.class);
    private static final String ENDPOINT_TEMPLATE =
        "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

    private final InvestigationConfig config;
    private final MockAiEvaluator mockAiEvaluator;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GeminiAiClientImpl(InvestigationConfig config, MockAiEvaluator mockAiEvaluator, ObjectMapper objectMapper) {
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
            log.info("No GEMINI_API_KEY found. Executing mock Copilot evaluator fallback.");
            return mockAiEvaluator.generateMockResponse(userPrompt);
        }

        String url = String.format(ENDPOINT_TEMPLATE, config.getAi().getModel()) + "?key=" + apiKey;
        log.info("Sending reanalysis payload to Gemini (model: {})", config.getAi().getModel());

        ObjectNode requestBody = objectMapper.createObjectNode();
        
        // System instruction mapping
        ObjectNode systemNode = objectMapper.createObjectNode();
        ArrayNode systemParts = objectMapper.createArrayNode();
        systemParts.add(objectMapper.createObjectNode().put("text", systemPrompt));
        systemNode.set("parts", systemParts);
        requestBody.set("systemInstruction", systemNode);

        // Contents mapping (user turn)
        ArrayNode contents = objectMapper.createArrayNode();
        ObjectNode userTurn = objectMapper.createObjectNode();
        userTurn.put("role", "user");
        ArrayNode userParts = objectMapper.createArrayNode();
        userParts.add(objectMapper.createObjectNode().put("text", userPrompt));
        userTurn.set("parts", userParts);
        contents.add(userTurn);
        requestBody.set("contents", contents);

        // Generation Config with native responseSchema
        ObjectNode generationConfig = objectMapper.createObjectNode();
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.set("responseSchema", buildResponseSchema());
        generationConfig.put("temperature", 0.0);
        requestBody.set("generationConfig", generationConfig);

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .timeout(Duration.ofSeconds(20))
            .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Gemini API returned error HTTP {}: {}", response.statusCode(), response.body());
            throw new AiUnavailableException("Gemini returned HTTP " + response.statusCode() + ": " + response.body());
        }

        return extractText(response.body());
    }

    private String extractText(String rawBody) throws Exception {
        JsonNode root = objectMapper.readTree(rawBody);
        JsonNode candidates = root.path("candidates");

        if (!candidates.isArray() || candidates.isEmpty()) {
            String blockReason = root.path("promptFeedback").path("blockReason").asText("UNKNOWN");
            throw new AiUnavailableException("Gemini returned no candidates — blockReason=" + blockReason);
        }

        JsonNode firstCandidate = candidates.get(0);
        String finishReason = firstCandidate.path("finishReason").asText("");
        if (!finishReason.isEmpty() && !"STOP".equals(finishReason)) {
            throw new AiUnavailableException("Gemini finishReason=" + finishReason + " — response incomplete or blocked");
        }

        JsonNode parts = firstCandidate.path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            throw new AiUnavailableException("Gemini returned candidate without parts");
        }

        String text = parts.get(0).path("text").asText(null);
        if (text == null || text.isBlank()) {
            throw new AiUnavailableException("Gemini returned an empty text part");
        }

        return stripMarkdownFences(text);
    }

    private String stripMarkdownFences(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```[a-zA-Z]*\\n?", "");
            trimmed = trimmed.replaceFirst("```\\s*$", "");
        }
        return trimmed.trim();
    }

    /**
     * OpenAPI 3.0 Schema mapping to List<AiSchemaContract> required by Gemini.
     */
    private JsonNode buildResponseSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "ARRAY");

        ObjectNode itemSchema = objectMapper.createObjectNode();
        itemSchema.put("type", "OBJECT");

        ObjectNode properties = objectMapper.createObjectNode();
        
        properties.set("nodeId", typeString());
        properties.set("aiClassification", enumSchema("CONFIRMED_VICTIM", "SUSPECTED_MULE", "UNDER_REVIEW", "LIKELY_INNOCENT", "CLEARED"));
        properties.set("confidence", typeNumber());
        
        // Evidence Array Schema
        ObjectNode evidenceArraySchema = objectMapper.createObjectNode();
        evidenceArraySchema.put("type", "ARRAY");
        ObjectNode evidenceItemSchema = objectMapper.createObjectNode();
        evidenceItemSchema.put("type", "OBJECT");
        ObjectNode evidenceProps = objectMapper.createObjectNode();
        evidenceProps.set("source", typeString());
        evidenceProps.set("derivedFrom", typeString());
        evidenceProps.set("weight", typeNumber());
        evidenceItemSchema.set("properties", evidenceProps);
        ArrayNode evidenceRequired = objectMapper.createArrayNode();
        evidenceRequired.add("source").add("derivedFrom").add("weight");
        evidenceItemSchema.set("required", evidenceRequired);
        evidenceArraySchema.set("items", evidenceItemSchema);
        properties.set("evidence", evidenceArraySchema);

        properties.set("recommendedAction", enumSchema("NO_ACTION", "MONITOR", "BRANCH_VERIFICATION", "PARTIAL_LIEN", "FULL_FREEZE", "ESCALATE"));

        itemSchema.set("properties", properties);
        ArrayNode requiredFields = objectMapper.createArrayNode();
        requiredFields.add("nodeId").add("aiClassification").add("confidence").add("evidence").add("recommendedAction");
        itemSchema.set("required", requiredFields);

        schema.set("items", itemSchema);
        return schema;
    }

    private JsonNode typeString() {
        return objectMapper.createObjectNode().put("type", "STRING");
    }

    private JsonNode typeNumber() {
        return objectMapper.createObjectNode().put("type", "NUMBER");
    }

    private JsonNode enumSchema(String... values) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "STRING");
        ArrayNode arr = objectMapper.createArrayNode();
        for (String val : values) {
            arr.add(val);
        }
        node.set("enum", arr);
        return node;
    }
}
