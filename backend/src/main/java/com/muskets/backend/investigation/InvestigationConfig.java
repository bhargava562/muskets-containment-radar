package com.muskets.backend.investigation;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import org.springframework.context.annotation.Bean;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;

/**
 * Configuration properties for the investigation module.
 *
 * <p>Externalized via {@code application.yaml} under {@code app.} prefix.
 * Includes AI provider settings, CORS origins, and rate-limiting thresholds.</p>
 */
@Configuration
@ConfigurationProperties(prefix = "app")
public class InvestigationConfig {

    private Ai ai = new Ai();
    private Investigation investigation = new Investigation();

    public Ai getAi() { return ai; }
    public void setAi(Ai ai) { this.ai = ai; }

    public Investigation getInvestigation() { return investigation; }
    public void setInvestigation(Investigation investigation) { this.investigation = investigation; }

    public static class Ai {
        private String provider = "anthropic";
        private String apiKey = "";
        private String model = "claude-sonnet-4-6";

        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }

        public String getApiKey() { return apiKey; }
        public void setApiKey(String apiKey) { this.apiKey = apiKey; }

        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }
    }

    public static class Investigation {
        private int reanalyzeRateLimitPerDay = 200;

        public int getReanalyzeRateLimitPerDay() { return reanalyzeRateLimitPerDay; }
        public void setReanalyzeRateLimitPerDay(int limit) { this.reanalyzeRateLimitPerDay = limit; }
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        return mapper;
    }
}
