package com.muskets.backend.detection.ingest;

import com.muskets.backend.detection.engine.PostOperatorEngine;
import com.muskets.backend.detection.engine.PreFlaggerEngine;
import com.muskets.backend.detection.model.MuleNetworkGraph;
import com.muskets.backend.detection.model.TransactionEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * REST endpoints for ingesting transactions into the detection module.
 *
 * <p>All endpoints live under {@code /api/detection}. The CSV replay
 * endpoint reads from the classpath — no file path assumptions.</p>
 */
@RestController
@RequestMapping("/api/detection")
public class TransactionIngestController {

    private static final Logger log = LoggerFactory.getLogger(TransactionIngestController.class);

    private final PreFlaggerEngine preFlagger;
    private final PostOperatorEngine postOperator;

    public TransactionIngestController(PreFlaggerEngine preFlagger, PostOperatorEngine postOperator) {
        this.preFlagger = preFlagger;
        this.postOperator = postOperator;
    }

    // ═════════════════════════════════════════════════════════════════
    //  TRANSACTION INGESTION
    // ═════════════════════════════════════════════════════════════════

    /**
     * Ingest a single transaction.
     */
    @PostMapping("/ingest")
    public ResponseEntity<Map<String, String>> ingest(@RequestBody TransactionEvent txn) {
        if (txn.getTimestampMillis() == 0) {
            txn.setTimestampMillis(System.currentTimeMillis());
        }
        preFlagger.processTransaction(txn);
        postOperator.recordTransaction(txn);
        return ResponseEntity.accepted().body(Map.of("status", "accepted"));
    }

    /**
     * Ingest a batch of transactions.
     */
    @PostMapping("/ingest/batch")
    public ResponseEntity<Map<String, Object>> ingestBatch(@RequestBody List<TransactionEvent> txns) {
        long start = System.nanoTime();
        for (TransactionEvent txn : txns) {
            if (txn.getTimestampMillis() == 0) {
                txn.setTimestampMillis(System.currentTimeMillis());
            }
            preFlagger.processTransaction(txn);
            postOperator.recordTransaction(txn);
        }
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;
        return ResponseEntity.accepted().body(Map.of(
                "status", "accepted",
                "count", txns.size(),
                "elapsedMs", elapsedMs
        ));
    }

    // ═════════════════════════════════════════════════════════════════
    //  CSV REPLAY (explicit trigger, not auto-load)
    // ═════════════════════════════════════════════════════════════════

    /**
     * Replay the sample CSV dataset through the detection engine.
     *
     * <p>Assigns synthetic incrementing timestamps (1ms apart) since
     * the raw CSV has all identical timestamps. This is an explicit
     * POST — not auto-loaded on boot — so every restart starts clean.</p>
     */
    @PostMapping("/replay-csv")
    public ResponseEntity<Map<String, Object>> replayCsv() {
        preFlagger.reset();
        postOperator.reset();

        long syntheticTimestamp = System.currentTimeMillis();
        int totalRows = 0;
        int parseErrors = 0;
        long startNanos = System.nanoTime();

        try {
            ClassPathResource resource = new ClassPathResource("sample_mule_account_data.csv");
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {

                String header = reader.readLine(); // skip header
                if (header == null) {
                    return ResponseEntity.badRequest().body(Map.of("error", "CSV file is empty"));
                }

                String line;
                while ((line = reader.readLine()) != null) {
                    try {
                        TransactionEvent txn = parseCsvLine(line, syntheticTimestamp);
                        preFlagger.processTransaction(txn);
                        postOperator.recordTransaction(txn);
                        totalRows++;
                        syntheticTimestamp++; // 1ms increment per row
                    } catch (Exception e) {
                        parseErrors++;
                        log.debug("CSV parse error on row {}: {}", totalRows + parseErrors, e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to read CSV file", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }

        long elapsedMs = (System.nanoTime() - startNanos) / 1_000_000;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalProcessed", totalRows);
        result.put("parseErrors", parseErrors);
        result.put("accountsRegistered", preFlagger.getRegistrySize());
        result.put("alertsEmitted", preFlagger.getAlertsEmitted());
        result.put("elapsedMs", elapsedMs);

        log.info("CSV replay complete: {} rows in {}ms, {} accounts, {} alerts",
                totalRows, elapsedMs, preFlagger.getRegistrySize(), preFlagger.getAlertsEmitted());

        return ResponseEntity.ok(result);
    }

    // ═════════════════════════════════════════════════════════════════
    //  DIAGNOSTICS
    // ═════════════════════════════════════════════════════════════════

    /**
     * Engine statistics — feeds the live dashboard counter.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(Map.of(
                "registrySize", preFlagger.getRegistrySize(),
                "totalProcessed", preFlagger.getTotalProcessed(),
                "alertsEmitted", preFlagger.getAlertsEmitted()
        ));
    }

    /**
     * Inspect a specific account's running state.
     */
    @GetMapping("/account/{acid}")
    public ResponseEntity<?> accountState(@PathVariable String acid) {
        var state = preFlagger.getAccountState(acid);
        if (state == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(state);
    }

    /**
     * Trace connected accounts from a flagged account (Job 2).
     */
    @GetMapping("/trace/{acid}")
    public ResponseEntity<MuleNetworkGraph> traceAccount(@PathVariable String acid) {
        MuleNetworkGraph graph = postOperator.traceConnectedAccounts(acid, System.currentTimeMillis());
        return ResponseEntity.ok(graph);
    }

    // ═════════════════════════════════════════════════════════════════
    //  CSV PARSING — pipe-delimited, no third-party dependency
    // ═════════════════════════════════════════════════════════════════

    /**
     * Parse a single pipe-delimited CSV line into a TransactionEvent.
     *
     * <p>Format: TRAN_DATE|TRAN_ID|TRAN_TYPE|TRAN_SUB_TYPE|PART_TRAN_TYPE|
     * ACID|TRAN_AMT|balance|channel|CIF_ID|ACCT_OPN_DATE|LIEN_AMT|customer_age</p>
     */
    private TransactionEvent parseCsvLine(String line, long syntheticTimestamp) {
        String[] fields = line.split("\\|", -1);
        if (fields.length < 13) {
            throw new IllegalArgumentException("Expected 13 fields, got " + fields.length);
        }

        TransactionEvent txn = new TransactionEvent();
        txn.setAcctOpnDate(fields[10].trim());         // ACCT_OPN_DATE (e.g. "22/11/2021 18:30")
        txn.setTranId(fields[1].trim());                // TRAN_ID
        txn.setTranType(fields[2].trim());              // TRAN_TYPE
        txn.setTranSubType(fields[3].trim());           // TRAN_SUB_TYPE
        txn.setPartTranType(fields[4].trim());          // PART_TRAN_TYPE (C or D)
        txn.setAcid(fields[5].trim());                  // ACID
        txn.setAmount(Double.parseDouble(fields[6].trim()));   // TRAN_AMT
        txn.setBalance(Double.parseDouble(fields[7].trim()));  // balance
        txn.setChannel(fields[8].trim());               // channel
        txn.setCifId(fields[9].trim());                 // CIF_ID
        txn.setLienAmt(Double.parseDouble(fields[11].trim())); // LIEN_AMT
        txn.setCustomerAge(Integer.parseInt(fields[12].trim())); // customer_age
        txn.setTimestampMillis(syntheticTimestamp);
        // counterpartyAcid stays null — raw CSV doesn't have it
        return txn;
    }
}
