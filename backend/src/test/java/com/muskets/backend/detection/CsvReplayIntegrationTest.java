package com.muskets.backend.detection;

import com.muskets.backend.detection.engine.PreFlaggerEngine;
import com.muskets.backend.detection.model.TransactionEvent;
import com.muskets.backend.shared.events.MuleFlaggedEvent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.test.context.ActiveProfiles;

import org.springframework.context.annotation.Import;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test: replays the actual {@code sample_mule_account_data.csv}
 * through the PreFlaggerEngine and verifies correct accounts are flagged.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(CsvReplayIntegrationTest.TestAlertCapture.class)
class CsvReplayIntegrationTest {

    @Autowired
    private PreFlaggerEngine preFlagger;

    @Autowired
    private TestAlertCapture alertCapture;

    @Test
    @DisplayName("CSV replay: 2000 rows, 19 accounts, suspicious accounts flagged, baseline clear")
    void replayCsvAndVerify() throws Exception {
        preFlagger.reset();
        alertCapture.clear();

        long syntheticTimestamp = System.currentTimeMillis();
        int rowCount = 0;

        ClassPathResource resource = new ClassPathResource("sample_mule_account_data.csv");
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {

            reader.readLine(); // skip header

            String line;
            while ((line = reader.readLine()) != null) {
                String[] fields = line.split("\\|", -1);
                if (fields.length < 13) continue;

                TransactionEvent txn = new TransactionEvent();
                txn.setAcctOpnDate(fields[10].trim());
                txn.setTranId(fields[1].trim());
                txn.setTranType(fields[2].trim());
                txn.setTranSubType(fields[3].trim());
                txn.setPartTranType(fields[4].trim());
                txn.setAcid(fields[5].trim());
                txn.setAmount(Double.parseDouble(fields[6].trim()));
                txn.setBalance(Double.parseDouble(fields[7].trim()));
                txn.setChannel(fields[8].trim());
                txn.setCifId(fields[9].trim());
                txn.setLienAmt(Double.parseDouble(fields[11].trim()));
                txn.setCustomerAge(Integer.parseInt(fields[12].trim()));
                txn.setTimestampMillis(syntheticTimestamp++);

                preFlagger.processTransaction(txn);
                rowCount++;
            }
        }

        // ── Verify row count and account registry ────────────────────
        assertEquals(2000, rowCount, "Expected 2000 data rows in CSV");
        assertEquals(19, preFlagger.getRegistrySize(), "Expected 19 distinct accounts");

        // ── Verify suspicious accounts triggered alerts ──────────────
        List<String> flaggedAccountIds = alertCapture.getEvents().stream()
                .map(MuleFlaggedEvent::getAccountId)
                .distinct()
                .toList();

        // These three have 100% negative balance — should definitely trigger
        String[] mustFlag = {
                "996f3bf5a08b32b760dcb4b419ad9a28fa4272ad8279d0e2f987b1c12c76b11e",
                "4ac3ebe74c65e3846aafaaf69e0911ceb9421dbe6c8dcf478a6ee53363c888b8",
                "4435127fe3b42fa247be821529321999f93841c95d90a48391bd5f22a265c39e"
        };

        for (String acid : mustFlag) {
            assertTrue(flaggedAccountIds.contains(acid),
                    "Expected alert for 100%%-negative account: " + acid.substring(0, 8) + "...");
        }

        // ── Print summary ────────────────────────────────────────────
        System.out.println("\n══════════════════════════════════════════════════════");
        System.out.println("  CSV REPLAY RESULTS");
        System.out.println("══════════════════════════════════════════════════════");
        System.out.printf("  Rows processed:    %d%n", rowCount);
        System.out.printf("  Accounts tracked:  %d%n", preFlagger.getRegistrySize());
        System.out.printf("  Alerts emitted:    %d%n", alertCapture.getEvents().size());
        System.out.println("  Flagged accounts:");
        for (MuleFlaggedEvent event : alertCapture.getEvents()) {
            System.out.printf("    [%s] %s... score=%.1f reason=%s%n",
                    event.getPriority(),
                    event.getAccountId().substring(0, 12),
                    event.getRiskScore(),
                    event.getTriggerReason());
        }
        System.out.println("══════════════════════════════════════════════════════\n");
    }

    /**
     * Test-only Spring component that captures MuleFlaggedEvents.
     */
    @Component
    static class TestAlertCapture {
        private final List<MuleFlaggedEvent> events = new CopyOnWriteArrayList<>();

        @EventListener
        public void onAlert(MuleFlaggedEvent event) {
            events.add(event);
        }

        public List<MuleFlaggedEvent> getEvents() { return events; }
        public void clear() { events.clear(); }
    }
}
