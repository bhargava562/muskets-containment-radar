package com.muskets.backend.alerts;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class HealthEndpointTest {

    @Mock
    private MuleFlaggedEventListener alertListener;

    @Mock
    private AlertLogRepository alertLogRepository;

    @Mock
    private com.muskets.backend.investigation.store.InvestigationContextStore contextStore;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        RootEndpointsController controller = new RootEndpointsController(
                alertListener,
                alertLogRepository,
                contextStore,
                eventPublisher
        );
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /health should return 200 with UP status and diagnostic payload")
    void healthCheckShouldReturnUp() throws Exception {
        when(alertLogRepository.count()).thenReturn(5L);

        mockMvc.perform(get("/health").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("muskets-backend"))
                .andExpect(jsonPath("$.database.status").value("UP"))
                .andExpect(jsonPath("$.memory.totalMb").isNumber())
                .andExpect(jsonPath("$.system.javaVersion").isNotEmpty())
                .andExpect(jsonPath("$.uptimeSeconds").isNumber());
    }

    @Test
    @DisplayName("GET /api/health should also return 200 with UP status")
    void apiHealthCheckShouldReturnUp() throws Exception {
        when(alertLogRepository.count()).thenReturn(5L);

        mockMvc.perform(get("/api/health").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("muskets-backend"));
    }

    @Test
    @DisplayName("GET /health should return 503 when database is down")
    void healthCheckShouldReturn503WhenDatabaseFails() throws Exception {
        when(alertLogRepository.count()).thenThrow(new RuntimeException("Connection refused"));

        mockMvc.perform(get("/health").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value("DEGRADED"))
                .andExpect(jsonPath("$.database.status").value("DOWN"))
                .andExpect(jsonPath("$.database.error").value("Connection refused"));
    }

    @Test
    @DisplayName("GET /events should return text/event-stream with anti-buffering Cache-Control")
    void eventsShouldReturnSseWithAntiBufferingHeaders() throws Exception {
        mockMvc.perform(get("/events"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-cache, no-transform"))
                .andExpect(header().string("X-Accel-Buffering", "no"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM));
    }
}
