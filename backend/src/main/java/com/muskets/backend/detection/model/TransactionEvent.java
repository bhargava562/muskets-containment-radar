package com.muskets.backend.detection.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Incoming transaction shape — internal to the detection module.
 *
 * <p>Maps both the CSV replay format (pipe-delimited) and the live JSON
 * ingestion format. The {@code counterpartyAcid} field is nullable — it is
 * absent in the raw CBS ledger export but present in simulator feeds that
 * include explicit {@code from}/{@code to} fields.</p>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class TransactionEvent {

    @JsonProperty("acid")
    private String acid;

    @JsonProperty("tranId")
    private String tranId;

    @JsonProperty("tranType")
    private String tranType;

    @JsonProperty("tranSubType")
    private String tranSubType;

    @JsonProperty("partTranType")
    private String partTranType; // "C" (credit) or "D" (debit)

    @JsonProperty("amount")
    private double amount;

    @JsonProperty("balance")
    private double balance;

    @JsonProperty("channel")
    private String channel;

    @JsonProperty("cifId")
    private String cifId;

    @JsonProperty("acctOpnDate")
    private String acctOpnDate;

    @JsonProperty("lienAmt")
    private double lienAmt;

    @JsonProperty("customerAge")
    private int customerAge;

    @JsonProperty("timestampMillis")
    private long timestampMillis;

    @JsonProperty("counterpartyAcid")
    private String counterpartyAcid; // nullable — absent in raw CBS export

    public TransactionEvent() {}

    // --- Helpers ---

    public boolean isDebit() {
        return "D".equals(partTranType);
    }

    public boolean isCredit() {
        return "C".equals(partTranType);
    }

    // --- Getters and Setters ---

    public String getAcid()                 { return acid; }
    public void setAcid(String acid)        { this.acid = acid; }

    public String getTranId()               { return tranId; }
    public void setTranId(String tranId)    { this.tranId = tranId; }

    public String getTranType()             { return tranType; }
    public void setTranType(String t)       { this.tranType = t; }

    public String getTranSubType()          { return tranSubType; }
    public void setTranSubType(String t)    { this.tranSubType = t; }

    public String getPartTranType()         { return partTranType; }
    public void setPartTranType(String p)   { this.partTranType = p; }

    public double getAmount()               { return amount; }
    public void setAmount(double amount)    { this.amount = amount; }

    public double getBalance()              { return balance; }
    public void setBalance(double balance)  { this.balance = balance; }

    public String getChannel()              { return channel; }
    public void setChannel(String channel)  { this.channel = channel; }

    public String getCifId()                { return cifId; }
    public void setCifId(String cifId)      { this.cifId = cifId; }

    public String getAcctOpnDate()          { return acctOpnDate; }
    public void setAcctOpnDate(String d)    { this.acctOpnDate = d; }

    public double getLienAmt()              { return lienAmt; }
    public void setLienAmt(double lienAmt)  { this.lienAmt = lienAmt; }

    public int getCustomerAge()             { return customerAge; }
    public void setCustomerAge(int age)     { this.customerAge = age; }

    public long getTimestampMillis()        { return timestampMillis; }
    public void setTimestampMillis(long ts) { this.timestampMillis = ts; }

    public String getCounterpartyAcid()             { return counterpartyAcid; }
    public void setCounterpartyAcid(String acid)    { this.counterpartyAcid = acid; }
}
