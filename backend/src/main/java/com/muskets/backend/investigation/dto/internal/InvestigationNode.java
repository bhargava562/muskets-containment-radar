package com.muskets.backend.investigation.dto.internal;

import java.util.List;

/**
 * A single node in the investigation graph (account in the mule network).
 *
 * <p>Carries two independent officer-set dimensions:</p>
 * <ul>
 *   <li>{@code officerVerdict} — assessment: do they agree with the AI?</li>
 *   <li>{@code nodeAction} — containment recommendation: what to do about this node?</li>
 * </ul>
 *
 * <p>The optional {@code officerNote} is mandatory when verdict is DISPUTED,
 * enforced via the blocking UI pattern (textarea must be filled before
 * the verdict fires).</p>
 */
public class InvestigationNode {

    private String nodeId;
    private String accountId;
    private String label;           // display name, e.g., "V1 — Victim", "M1 — Suspected Mule"
    private String nodeType;        // "VICTIM", "MULE", "MERCHANT", "UNKNOWN"
    private KycData kyc;
    private CbsData cbs;
    private DeviceData device;
    private ComplaintData complaint;
    private AiAnalysis aiAnalysis;
    private OfficerVerdict officerVerdict;
    private NodeAction nodeAction;
    private String officerNote;     // mandatory when verdict is DISPUTED
    private List<TransactionSummary> recentTransactions;

    public InvestigationNode() {
        this.officerVerdict = OfficerVerdict.UNREVIEWED;
        this.nodeAction = NodeAction.NO_ACTION;
    }

    // --- Getters & Setters ---

    public String getNodeId() { return nodeId; }
    public void setNodeId(String nodeId) { this.nodeId = nodeId; }

    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getNodeType() { return nodeType; }
    public void setNodeType(String nodeType) { this.nodeType = nodeType; }

    public KycData getKyc() { return kyc; }
    public void setKyc(KycData kyc) { this.kyc = kyc; }

    public CbsData getCbs() { return cbs; }
    public void setCbs(CbsData cbs) { this.cbs = cbs; }

    public DeviceData getDevice() { return device; }
    public void setDevice(DeviceData device) { this.device = device; }

    public ComplaintData getComplaint() { return complaint; }
    public void setComplaint(ComplaintData complaint) { this.complaint = complaint; }

    public AiAnalysis getAiAnalysis() { return aiAnalysis; }
    public void setAiAnalysis(AiAnalysis aiAnalysis) { this.aiAnalysis = aiAnalysis; }

    public OfficerVerdict getOfficerVerdict() { return officerVerdict; }
    public void setOfficerVerdict(OfficerVerdict officerVerdict) { this.officerVerdict = officerVerdict; }

    public NodeAction getNodeAction() { return nodeAction; }
    public void setNodeAction(NodeAction nodeAction) { this.nodeAction = nodeAction; }

    public String getOfficerNote() { return officerNote; }
    public void setOfficerNote(String officerNote) { this.officerNote = officerNote; }

    public List<TransactionSummary> getRecentTransactions() { return recentTransactions; }
    public void setRecentTransactions(List<TransactionSummary> recentTransactions) { this.recentTransactions = recentTransactions; }
}
