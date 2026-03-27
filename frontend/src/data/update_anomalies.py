import json

# Read the current data
with open('iob_mock_data.json', 'r') as f:
    data = json.load(f)

# Update 2nd critical anomaly alert
data['transactions']['critical_alerts'][1] = {
    "id": "ALERT-ML6-2026-00923",
    "alert_type": "MULE_LAYERING_NETWORK",
    "severity": "CRITICAL",
    "risk_score": 96,
    "timestamp": "2026-03-27T11:15:42.123Z",
    "source_account": "185501000034567",
    "source_ifsc": "IOBA0001855",
    "total_amount": 350000,
    "fragmentation_count": 6,
    "time_window_seconds": 180,
    "description": "COMPLEX MULE LAYERING DETECTED. Rs.3,50,000 moved through 6-layer mule network in coordinated pattern.",
    "trigger_rules": [
        "MULTI_HOP_LAYERING",
        "COORDINATED_NETWORK_ACTIVITY",
        "CROSS_BANK_CASCADE",
        "VELOCITY_SPIKE_CLUSTER"
    ],
    "outbound_transactions": [
        {"utr": "IOBA26087312456I", "amount": 60000, "beneficiary": "501234000098765", "beneficiary_ifsc": "SBIN0005012", "timestamp": "2026-03-27T11:15:42.123Z"},
        {"utr": "IOBA26087312457I", "amount": 55000, "beneficiary": "403201000054321", "beneficiary_ifsc": "PUNB0403201", "timestamp": "2026-03-27T11:16:15.456Z"},
        {"utr": "IOBA26087312458I", "amount": 60000, "beneficiary": "712308000087654", "beneficiary_ifsc": "BARB0VJTHUN", "timestamp": "2026-03-27T11:16:42.789Z"},
        {"utr": "IOBA26087312459I", "amount": 58000, "beneficiary": "920020000045678", "beneficiary_ifsc": "UTIB0000920", "timestamp": "2026-03-27T11:17:08.123Z"},
        {"utr": "IOBA26087312460I", "amount": 62000, "beneficiary": "234510000076543", "beneficiary_ifsc": "FDRL0002345", "timestamp": "2026-03-27T11:17:35.456Z"},
        {"utr": "IOBA26087312461I", "amount": 55000, "beneficiary": "812205000012398", "beneficiary_ifsc": "YESB0008122", "timestamp": "2026-03-27T11:17:58.891Z"}
    ],
    "graph_structure_id": "mule_layering_network"
}

# Update 3rd critical anomaly alert
data['transactions']['critical_alerts'][2] = {
    "id": "ALERT-CMX-2026-01124",
    "alert_type": "COMPLEX_LAUNDERING_NETWORK",
    "severity": "CRITICAL",
    "risk_score": 98,
    "timestamp": "2026-03-27T12:22:18.456Z",
    "source_account": "185501000056789",
    "source_ifsc": "IOBA0001855",
    "total_amount": 520000,
    "fragmentation_count": 13,
    "time_window_seconds": 240,
    "description": "SOPHISTICATED LAUNDERING NETWORK DETECTED. Rs.5,20,000 dispersed through 8 mules and 5 legitimate businesses to obscure trail.",
    "trigger_rules": [
        "COMPLEX_NETWORK_TOPOLOGY",
        "MERCHANT_LAYERING_PATTERN",
        "BULK_CASH_STRUCTURING",
        "MULTI_LEVEL_OBFUSCATION"
    ],
    "outbound_transactions": [
        {"utr": "IOBA26087398721I", "amount": 40000, "beneficiary": "712308000034521", "beneficiary_ifsc": "BARB0VJTHUN", "timestamp": "2026-03-27T12:22:18.456Z"},
        {"utr": "IOBA26087398722I", "amount": 42000, "beneficiary": "185503000098765", "beneficiary_ifsc": "IOBA0001857", "timestamp": "2026-03-27T12:23:05.789Z"},
        {"utr": "IOBA26087398723I", "amount": 38000, "beneficiary": "920020000087654", "beneficiary_ifsc": "UTIB0000920", "timestamp": "2026-03-27T12:23:42.123Z"}
    ],
    "graph_structure_id": "complex_laundering_network"
}

# Create 2nd graph structure - 6 mules only
data['graph_structures']['mule_layering_network'] = {
    "description": "Six-layer mule cascade network",
    "nodes": [
        {
            "id": "MULE_LAYER_01", "type": "mule", "mule_level": 1, "label": "LAYER 1", "display_state": "confirmed", "reveal_order": 1,
            "account_holder": "Unknown Entity", "account_number": "501234000098765", "ifsc_code": "SBIN0005012",
            "branch": "SBI MG Road, Bangalore", "received_amount": 60000, "current_balance": 8200, "velocity": 16, "fragmentation_ratio": 4.8, "outward_transfers": 5,
            "ai_reasoning": {"classification": "ACTIVE_MULE", "confidence": 0.97, "is_mule": True, "evidence": ["Entry point mule", "High velocity: 16 tx/min", "New account setup"], "account_age_days": 12}
        },
        {
            "id": "MULE_LAYER_02", "type": "mule", "mule_level": 1, "label": "LAYER 2", "display_state": "hidden", "reveal_order": 2,
            "account_holder": "Unknown Entity", "account_number": "403201000054321", "ifsc_code": "PUNB0403201",
            "branch": "PNB Koramangala, Bangalore", "received_amount": 55000, "current_balance": 7100, "velocity": 14, "fragmentation_ratio": 4.2, "outward_transfers": 4,
            "ai_reasoning": {"classification": "ACTIVE_MULE", "confidence": 0.95, "is_mule": True, "evidence": ["Immediate relay pattern", "Cross-bank transfer"], "account_age_days": 15}
        },
        {
            "id": "MULE_LAYER_03", "type": "mule", "mule_level": 2, "label": "LAYER 3", "display_state": "hidden", "reveal_order": 3,
            "account_holder": "Unknown Entity", "account_number": "712308000087654", "ifsc_code": "BARB0VJTHUN",
            "branch": "Bank of Baroda Thane, Mumbai", "received_amount": 60000, "current_balance": 6500, "velocity": 13, "fragmentation_ratio": 3.9, "outward_transfers": 4,
            "ai_reasoning": {"classification": "ACTIVE_MULE", "confidence": 0.94, "is_mule": True, "evidence": ["Mid-layer relay", "Geographic hop"], "account_age_days": 18}
        },
        {
            "id": "MULE_LAYER_04", "type": "mule", "mule_level": 2, "label": "LAYER 4", "display_state": "hidden", "reveal_order": 4,
            "account_holder": "Unknown Entity", "account_number": "920020000045678", "ifsc_code": "UTIB0000920",
            "branch": "Axis Bank Goregaon, Mumbai", "received_amount": 58000, "current_balance": 5800, "velocity": 12, "fragmentation_ratio": 3.5, "outward_transfers": 3,
            "ai_reasoning": {"classification": "ACTIVE_MULE", "confidence": 0.93, "is_mule": True, "evidence": ["Layering node", "Quick turnover"], "account_age_days": 21}
        },
        {
            "id": "MULE_LAYER_05", "type": "mule", "mule_level": 3, "label": "LAYER 5", "display_state": "hidden", "reveal_order": 5,
            "account_holder": "Unknown Entity", "account_number": "234510000076543", "ifsc_code": "FDRL0002345",
            "branch": "Federal Bank Malad, Mumbai", "received_amount": 62000, "current_balance": 4200, "velocity": 11, "fragmentation_ratio": 3.2, "outward_transfers": 3,
            "ai_reasoning": {"classification": "ACTIVE_MULE", "confidence": 0.92, "is_mule": True, "evidence": ["Pre-exit layering", "Fund consolidation"], "account_age_days": 25}
        },
        {
            "id": "MULE_LAYER_06", "type": "mule", "mule_level": 3, "label": "LAYER 6", "display_state": "hidden", "reveal_order": 6,
            "account_holder": "Unknown Entity", "account_number": "812205000012398", "ifsc_code": "YESB0008122",
            "branch": "Yes Bank BKC, Mumbai", "received_amount": 55000, "current_balance": 3100, "velocity": 10, "fragmentation_ratio": 2.8, "outward_transfers": 2,
            "ai_reasoning": {"classification": "ACTIVE_MULE", "confidence": 0.91, "is_mule": True, "evidence": ["Exit layer mule", "Final hop before cash out"], "account_age_days": 28}
        }
    ],
    "links": [
        {"source": "MULE_LAYER_01", "target": "MULE_LAYER_03", "value": 52000, "utr": "SBIN26087345001I", "txn_type": "IMPS", "reveal_order": 1},
        {"source": "MULE_LAYER_02", "target": "MULE_LAYER_04", "value": 48000, "utr": "PUNB26087345002I", "txn_type": "IMPS", "reveal_order": 2},
        {"source": "MULE_LAYER_03", "target": "MULE_LAYER_05", "value": 47000, "utr": "BARB26087345003I", "txn_type": "NEFT", "reveal_order": 3},
        {"source": "MULE_LAYER_04", "target": "MULE_LAYER_06", "value": 45000, "utr": "UTIB26087345004N", "txn_type": "NEFT", "reveal_order": 4},
        {"source": "MULE_LAYER_05", "target": "MULE_LAYER_06", "value": 43000, "utr": "FDRL26087345005N", "txn_type": "NEFT", "reveal_order": 5}
    ]
}

# Create 3rd graph structure - 8 mules + 5 innocents
data['graph_structures']['complex_laundering_network'] = {
    "description": "Complex network with 8 mules and 5 innocent merchants",
    "nodes": [
        {
            "id": "MULE_ALPHA", "type": "mule", "mule_level": 1, "label": "ALPHA", "display_state": "confirmed", "reveal_order": 1,
            "account_holder": "Unknown Entity", "account_number": "712308000034521", "ifsc_code": "BARB0VJTHUN",
            "branch": "Bank of Baroda Thane, Mumbai", "received_amount": 40000, "current_balance": 5200, "velocity": 15, "fragmentation_ratio": 4.3, "outward_transfers": 5,
            "ai_reasoning": {"classification": "ACTIVE_MULE", "confidence": 0.96, "is_mule": True, "evidence": ["Entry mule", "High velocity"], "account_age_days": 14}
        },
        {
            "id": "MULE_BETA", "type": "mule", "mule_level": 1, "label": "BETA", "display_state": "hidden", "reveal_order": 2,
            "account_holder": "Unknown Entity", "account_number": "185503000098765", "ifsc_code": "IOBA0001857",
            "branch": "IOB Andheri, Mumbai", "received_amount": 42000, "current_balance": 4800, "velocity": 14, "fragmentation_ratio": 4.0, "outward_transfers": 4,
            "ai_reasoning": {"classification": "ACTIVE_MULE", "confidence": 0.95, "is_mule": True, "evidence": ["Parallel entry mule"], "account_age_days": 16}
        },
        {
            "id": "MULE_GAMMA", "type": "mule", "mule_level": 1, "label": "GAMMA", "display_state": "hidden", "reveal_order": 3,
            "account_holder": "Unknown Entity", "account_number": "920020000087654", "ifsc_code": "UTIB0000920",
            "branch": "Axis Bank Goregaon, Mumbai", "received_amount": 38000, "current_balance": 4200, "velocity": 13, "fragmentation_ratio": 3.7, "outward_transfers": 4,
            "ai_reasoning": {"classification": "ACTIVE_MULE", "confidence": 0.94, "is_mule": True, "evidence": ["Entry cluster node"], "account_age_days": 19}
        },
        {
            "id": "MULE_DELTA", "type": "mule", "mule_level": 2, "label": "DELTA", "display_state": "hidden", "reveal_order": 4,
            "account_holder": "Unknown Entity", "account_number": "234510000076543", "ifsc_code": "FDRL0002345",
            "branch": "Federal Bank Malad, Mumbai", "received_amount": 75000, "current_balance": 8100, "velocity": 12, "fragmentation_ratio": 3.4, "outward_transfers": 4,
            "ai_reasoning": {"classification": "ACTIVE_MULE", "confidence": 0.93, "is_mule": True, "evidence": ["Consolidation mule"], "account_age_days": 22}
        },
        {
            "id": "MULE_EPSILON", "type": "mule", "mule_level": 2, "label": "EPSILON", "display_state": "hidden", "reveal_order": 5,
            "account_holder": "Unknown Entity", "account_number": "812205000012398", "ifsc_code": "YESB0008122",
            "branch": "Yes Bank BKC, Mumbai", "received_amount": 70000, "current_balance": 7500, "velocity": 11, "fragmentation_ratio": 3.1, "outward_transfers": 3,
            "ai_reasoning": {"classification": "ACTIVE_MULE", "confidence": 0.92, "is_mule": True, "evidence": ["Consolidation node"], "account_age_days": 25}
        },
        {
            "id": "MULE_ZETA", "type": "mule", "mule_level": 3, "label": "ZETA", "display_state": "hidden", "reveal_order": 6,
            "account_holder": "Unknown Entity", "account_number": "501234000087321", "ifsc_code": "SBIN0005012",
            "branch": "SBI Whitefield, Bangalore", "received_amount": 65000, "current_balance": 6800, "velocity": 10, "fragmentation_ratio": 2.9, "outward_transfers": 3,
            "ai_reasoning": {"classification": "ACTIVE_MULE", "confidence": 0.91, "is_mule": True, "evidence": ["Distribution mule"], "account_age_days": 28}
        },
        {
            "id": "MULE_ETA", "type": "mule", "mule_level": 3, "label": "ETA", "display_state": "hidden", "reveal_order": 7,
            "account_holder": "Unknown Entity", "account_number": "403201000054321", "ifsc_code": "PUNB0403201",
            "branch": "PNB HSR Layout, Bangalore", "received_amount": 60000, "current_balance": 5900, "velocity": 9, "fragmentation_ratio": 2.6, "outward_transfers": 3,
            "ai_reasoning": {"classification": "ACTIVE_MULE", "confidence": 0.90, "is_mule": True, "evidence": ["Distribution layer"], "account_age_days": 31}
        },
        {
            "id": "MULE_THETA", "type": "mule", "mule_level": 3, "label": "THETA", "display_state": "hidden", "reveal_order": 8,
            "account_holder": "Unknown Entity", "account_number": "602305001987654", "ifsc_code": "ICIC0006023",
            "branch": "ICICI Indiranagar, Bangalore", "received_amount": 58000, "current_balance": 5200, "velocity": 8, "fragmentation_ratio": 2.3, "outward_transfers": 2,
            "ai_reasoning": {"classification": "ACTIVE_MULE", "confidence": 0.89, "is_mule": True, "evidence": ["Final distribution mule"], "account_age_days": 35}
        },
        {
            "id": "MERCHANT_ELECTRONICS", "type": "merchant", "label": "ELECTRONICS", "display_state": "hidden", "reveal_order": 9,
            "business_name": "TechHub Electronics", "account_holder": "TechHub Pvt Ltd", "account_number": "916010000045678", "ifsc_code": "UTIB0000234",
            "branch": "Axis Bank Commercial St, Bangalore", "gst_number": "29AABCT1234F1Z1", "mcc_code": "5732", "traced_funds": 42000, "current_balance": 2100000,
            "ai_reasoning": {"classification": "PASSIVE_INNOCENT", "confidence": 0.86, "is_mule": False, "evidence": ["Legitimate business", "No fragmentation pattern"]}
        },
        {
            "id": "MERCHANT_GROCERY", "type": "merchant", "label": "GROCERY", "display_state": "hidden", "reveal_order": 10,
            "business_name": "FreshMart Supermarket", "account_holder": "FreshMart Retail LLP", "account_number": "185501000089123", "ifsc_code": "IOBA0001855",
            "branch": "IOB Jayanagar, Bangalore", "gst_number": "29AACFL2345K1Z2", "mcc_code": "5411", "traced_funds": 38000, "current_balance": 1800000,
            "ai_reasoning": {"classification": "PASSIVE_INNOCENT", "confidence": 0.87, "is_mule": False, "evidence": ["Regular merchant operations"]}
        },
        {
            "id": "MERCHANT_RESTAURANT", "type": "merchant", "label": "RESTAURANT", "display_state": "hidden", "reveal_order": 11,
            "business_name": "Royal Dining Restaurant", "account_holder": "Royal Foods Pvt Ltd", "account_number": "712308000098765", "ifsc_code": "BARB0VJTHUN",
            "branch": "BOB Koramangala, Bangalore", "gst_number": "29AACRR3456M1Z3", "mcc_code": "5812", "traced_funds": 35000, "current_balance": 950000,
            "ai_reasoning": {"classification": "PASSIVE_INNOCENT", "confidence": 0.85, "is_mule": False, "evidence": ["Active restaurant business"]}
        },
        {
            "id": "MERCHANT_PHARMACY", "type": "merchant", "label": "PHARMACY", "display_state": "hidden", "reveal_order": 12,
            "business_name": "HealthPlus Pharmacy", "account_holder": "HealthPlus Medical LLP", "account_number": "920020000012345", "ifsc_code": "UTIB0000920",
            "branch": "Axis Bank Malleshwaram, Bangalore", "gst_number": "29AAHPM4567P1Z4", "mcc_code": "5912", "traced_funds": 32000, "current_balance": 1200000,
            "ai_reasoning": {"classification": "PASSIVE_INNOCENT", "confidence": 0.88, "is_mule": False, "evidence": ["Licensed pharmacy"]}
        },
        {
            "id": "MERCHANT_CLOTHING", "type": "merchant", "label": "CLOTHING", "display_state": "hidden", "reveal_order": 13,
            "business_name": "Fashion Street Boutique", "account_holder": "Fashion Street Pvt Ltd", "account_number": "234510000087654", "ifsc_code": "FDRL0002345",
            "branch": "Federal Bank MG Road, Bangalore", "gst_number": "29AAFS5678Q1Z5", "mcc_code": "5651", "traced_funds": 33000, "current_balance": 850000,
            "ai_reasoning": {"classification": "PASSIVE_INNOCENT", "confidence": 0.84, "is_mule": False, "evidence": ["Established retail business"]}
        }
    ],
    "links": [
        {"source": "MULE_ALPHA", "target": "MULE_DELTA", "value": 35000, "utr": "BARB26087401001I", "txn_type": "IMPS", "reveal_order": 1},
        {"source": "MULE_BETA", "target": "MULE_DELTA", "value": 37000, "utr": "IOBA26087401002I", "txn_type": "IMPS", "reveal_order": 2},
        {"source": "MULE_GAMMA", "target": "MULE_EPSILON", "value": 33000, "utr": "UTIB26087401003I", "txn_type": "IMPS", "reveal_order": 3},
        {"source": "MULE_DELTA", "target": "MULE_ZETA", "value": 32000, "utr": "FDRL26087401004N", "txn_type": "NEFT", "reveal_order": 4},
        {"source": "MULE_DELTA", "target": "MULE_ETA", "value": 30000, "utr": "FDRL26087401005N", "txn_type": "NEFT", "reveal_order": 5},
        {"source": "MULE_EPSILON", "target": "MULE_THETA", "value": 31000, "utr": "YESB26087401006N", "txn_type": "NEFT", "reveal_order": 6},
        {"source": "MULE_ZETA", "target": "MERCHANT_ELECTRONICS", "value": 28000, "utr": "SBIN26087401007N", "txn_type": "NEFT", "reveal_order": 7},
        {"source": "MULE_ZETA", "target": "MERCHANT_GROCERY", "value": 26000, "utr": "SBIN26087401008N", "txn_type": "NEFT", "reveal_order": 8},
        {"source": "MULE_ETA", "target": "MERCHANT_RESTAURANT", "value": 25000, "utr": "PUNB26087401009N", "txn_type": "NEFT", "reveal_order": 9},
        {"source": "MULE_ETA", "target": "MERCHANT_PHARMACY", "value": 24000, "utr": "PUNB26087401010N", "txn_type": "NEFT", "reveal_order": 10},
        {"source": "MULE_THETA", "target": "MERCHANT_CLOTHING", "value": 23000, "utr": "ICIC26087401011N", "txn_type": "NEFT", "reveal_order": 11}
    ]
}

# Remove old ato_chain and smurfing_network
del data['graph_structures']['ato_chain']
del data['graph_structures']['smurfing_network']

# Save the updated data
with open('iob_mock_data.json', 'w') as f:
    json.dump(data, f, indent=2)

print("Dataset updated successfully!")
print("- 1st anomaly: 1 victim + 3 mules + 1 innocent merchant")
print("- 2nd anomaly: 6 mules only")
print("- 3rd anomaly: 8 mules + 5 innocent merchants")
