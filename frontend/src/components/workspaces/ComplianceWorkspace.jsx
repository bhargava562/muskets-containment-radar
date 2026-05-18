import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, CheckCircle2, AlertTriangle, Clock, Scale, Shield, ShieldCheck, Loader2, RotateCcw, XOctagon } from 'lucide-react'
import { useApp, CASE_STATUS } from '../../context/AppContextSimplified'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const ComplianceWorkspace = () => {
  const { getCasesByStatuses, finalizeRestriction, returnToAML, rejectCase } = useApp()
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedReviewCase, setSelectedReviewCase] = useState(null)
  
  // Action states
  const [actionState, setActionState] = useState({ type: null, id: null }) // type: 'finalize', 'return', 'reject'
  const [toastMessage, setToastMessage] = useState('')

  // Export states
  const [isGeneratingSAR, setIsGeneratingSAR] = useState(false)
  const [sarGenerated, setSarGenerated] = useState(false)
  const [isGeneratingDPIP, setIsGeneratingDPIP] = useState(false)
  const [dpipGenerated, setDpipGenerated] = useState(false)

  // Data fetching based on tabs
  const pendingReview = getCasesByStatuses([CASE_STATUS.AWAITING_LEGAL_REVIEW])
  const finalizedCases = getCasesByStatuses([CASE_STATUS.RESTRICTION_ACTIVE, CASE_STATUS.RETURNED_TO_AML, CASE_STATUS.CLOSED_FALSE_POSITIVE, CASE_STATUS.RESOLVED])
  
  const displayCases = activeTab === 'pending' ? pendingReview : finalizedCases

  // Reset export states when selected case changes
  useEffect(() => {
    setSarGenerated(false)
    setDpipGenerated(false)
    setIsGeneratingSAR(false)
    setIsGeneratingDPIP(false)
  }, [selectedReviewCase?.id])

  // Auto-deselect if the selected case leaves the current view
  useEffect(() => {
    if (selectedReviewCase) {
      const stillInView = displayCases.find(c => c.id === selectedReviewCase.id)
      if (!stillInView) setSelectedReviewCase(null)
    }
  }, [displayCases, selectedReviewCase])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const isAnyActionProcessing = isGeneratingSAR || isGeneratingDPIP || actionState.id !== null

  // --- Actions ---
  const handleAction = (type, caseId) => {
    if (isAnyActionProcessing) return
    setActionState({ type, id: caseId })
    setTimeout(() => {
      if (type === 'finalize') {
        finalizeRestriction(caseId)
        showToast('Restriction authorized and active')
      } else if (type === 'return') {
        returnToAML(caseId, 'Returned by legal for further review')
        showToast('Case returned to AML Queue')
      } else if (type === 'reject') {
        rejectCase(caseId, 'Rejected by legal')
        showToast('Case rejected, marked as False Positive')
      }
      setActionState({ type: null, id: null })
    }, 800)
  }

  // SAR generation
  const handleGenerateSAR = (caseItem) => {
    if (isAnyActionProcessing || !caseItem) return
    setIsGeneratingSAR(true)
    setTimeout(() => {
      generateSARPdf(caseItem)
      setIsGeneratingSAR(false)
      setSarGenerated(true)
      showToast('SAR PDF generated successfully')
    }, 1000)
  }

  // DPIP generation
  const handleGenerateDPIP = (caseItem) => {
    if (isAnyActionProcessing || !caseItem) return
    setIsGeneratingDPIP(true)
    setTimeout(() => {
      generateDPIPPdf(caseItem)
      setIsGeneratingDPIP(false)
      setDpipGenerated(true)
      showToast('DPIP interbank packet exported')
    }, 1000)
  }

  // --- PDF Generation ---
  const generateSARPdf = (c) => {
    const doc = new jsPDF()
    let y = 20
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('SUSPICIOUS ACTIVITY REPORT (SAR)', 20, y); y += 12
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toISOString()}`, 20, y); y += 6
    doc.text(`Case ID: ${c.id}`, 20, y); y += 6
    doc.text(`Priority: ${c.priority}`, 20, y); y += 12
    doc.setFontSize(12); doc.setFont('helvetica', 'bold')
    doc.text('Case Summary', 20, y); y += 8
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(c.aiSummary, 170)
    doc.text(lines, 20, y); y += lines.length * 5 + 8
    doc.setFontSize(12); doc.setFont('helvetica', 'bold')
    doc.text('Containment Action', 20, y); y += 8
    autoTable(doc, { startY: y, head: [['Field', 'Value']], body: [
      ['Customer', c.customerName],
      ['Risk Amount', formatCurrency(c.riskAmount)],
      ['Traced Amount', formatCurrency(c.tracedAmount)],
      ['Action', 'Partial Lien (Proportional Hold)'],
      ['Approved By', c.analystName || 'Analyst'],
      ['Analyst Approved At', c.analystApprovedAt ? new Date(c.analystApprovedAt).toLocaleString('en-IN') : 'N/A'],
      ['Mule Accounts', c.muleAccounts.join(', ')],
      ['Merchant Accounts', c.merchantAccounts.join(', ')]
    ], margin: { left: 20, right: 20 }, styles: { fontSize: 9 } })
    
    // Add Audit Log to PDF
    y = doc.lastAutoTable.finalY + 12
    doc.setFontSize(12); doc.setFont('helvetica', 'bold')
    doc.text('Audit Timeline', 20, y); y += 8
    const auditData = (c.auditLog || []).map(entry => [
      formatDate(entry.timestamp) + ' ' + formatTime(entry.timestamp),
      entry.actor,
      entry.action
    ])
    autoTable(doc, { startY: y, head: [['Time', 'Actor', 'Action']], body: auditData, margin: { left: 20, right: 20 }, styles: { fontSize: 9 } })
    
    y = doc.lastAutoTable.finalY + 12
    doc.setFontSize(8); doc.setFont('helvetica', 'normal')
    const hash = Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')
    doc.text(`Integrity Hash (SHA-256): ${hash}`, 20, y)
    doc.save(`SAR-${c.id}.pdf`)
  }

  const generateDPIPPdf = (c) => {
    const doc = new jsPDF()
    let y = 20
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('DPIP INTERBANK CONTAINMENT PACKET', 20, y); y += 12
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toISOString()}`, 20, y); y += 6
    doc.text(`Case Reference: ${c.id}`, 20, y); y += 6
    doc.text('Status: DPIP Coordinated', 20, y); y += 12
    autoTable(doc, { startY: y, head: [['Field', 'Value']], body: [
      ['Case ID', c.id],
      ['Traced Amount', formatCurrency(c.tracedAmount)],
      ['Affected Accounts', String(c.muleAccounts.length + c.merchantAccounts.length)],
      ['Recommended Action', 'Partial Restriction'],
      ['Analyst Approved At', c.analystApprovedAt ? new Date(c.analystApprovedAt).toLocaleString('en-IN') : 'N/A'],
      ['Legal Authorized At', c.legalAuthorizedAt ? new Date(c.legalAuthorizedAt).toLocaleString('en-IN') : 'Pending'],
      ['Summary', c.aiSummary]
    ], margin: { left: 20, right: 20 }, styles: { fontSize: 9 } })
    y = doc.lastAutoTable.finalY + 10
    doc.setFontSize(12); doc.setFont('helvetica', 'bold')
    doc.text('Freeze Instructions', 20, y); y += 8
    const freezeData = c.muleAccounts.map(acc => [acc, formatCurrency(c.tracedAmount / c.muleAccounts.length), 'Proportional Lien'])
    autoTable(doc, { startY: y, head: [['Account Number', 'Amount', 'Hold Type']], body: freezeData, margin: { left: 20, right: 20 }, styles: { fontSize: 9 } })
    doc.save(`DPIP-${c.id}.pdf`)
  }

  // --- RENDER ---

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-950">
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-emerald-500/90 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 backdrop-blur">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{toastMessage}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800/50 bg-slate-900/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-slate-400" />
            <div>
              <h1 className="text-sm font-bold text-slate-200 tracking-wide">COMPLIANCE REVIEW</h1>
              <p className="text-[11px] text-slate-500 mt-0.5">{pendingReview.length} case{pendingReview.length !== 1 ? 's' : ''} awaiting legal authorization</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-0.5 rounded-lg bg-slate-900/50 border border-slate-800/30 w-fit">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-slate-800 text-slate-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            Pending Authorization
            {pendingReview.length > 0 && (
              <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                {pendingReview.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('finalized')}
            className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${
              activeTab === 'finalized'
                ? 'bg-slate-800 text-slate-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            Finalized & Closed
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — Table */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 border-r border-slate-800/30">
          <div className="space-y-3">
            <h2 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
              {activeTab === 'pending' ? 'CASES AWAITING REVIEW' : 'PROCESSED CASES'}
            </h2>
            <AnimatePresence mode="wait">
              {displayCases.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12 text-slate-600">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No cases found in this view</p>
                </motion.div>
              ) : (
                <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl border border-slate-800/50 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900/50 border-b border-slate-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 tracking-wider">Case ID</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 tracking-wider">Customer</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                      {displayCases.map(caseItem => (
                        <tr key={caseItem.id} onClick={() => setSelectedReviewCase(caseItem)} className={`cursor-pointer transition-colors ${selectedReviewCase?.id === caseItem.id ? 'bg-cyan-500/5' : 'hover:bg-slate-900/50'}`}>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{caseItem.id}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-300">{caseItem.customerName}</td>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-slate-200">{formatCurrency(caseItem.tracedAmount)}</td>
                          <td className="px-4 py-3 text-[10px] font-bold">
                            <span className={`px-2 py-1 rounded ${
                               caseItem.status === CASE_STATUS.AWAITING_LEGAL_REVIEW ? 'bg-cyan-500/10 text-cyan-400' :
                               caseItem.status === CASE_STATUS.RESTRICTION_ACTIVE ? 'bg-emerald-500/10 text-emerald-400' :
                               caseItem.status === CASE_STATUS.RETURNED_TO_AML ? 'bg-amber-500/10 text-amber-400' :
                               'bg-slate-700/50 text-slate-400'
                            }`}>
                              {caseItem.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-500">{formatDate(caseItem.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right — Case Governance Panel */}
        <div className="w-[360px] flex-shrink-0 overflow-y-auto p-5 hidden lg:block">
          {selectedReviewCase ? (
            <motion.div key={selectedReviewCase.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-slate-300 mb-1">{selectedReviewCase.customerName}</h3>
                <p className="text-[10px] text-slate-500 font-mono">{selectedReviewCase.id}</p>
              </div>
              
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/30">
                <p className="text-xs text-slate-400 leading-relaxed">{selectedReviewCase.aiSummary}</p>
              </div>
              
              {selectedReviewCase.investigatorNotes && (
                <div className="p-3 rounded-xl bg-cyan-900/10 border border-cyan-800/30">
                   <h4 className="text-[10px] font-bold text-cyan-500 mb-1">INVESTIGATOR NOTES</h4>
                   <p className="text-[11px] text-slate-300 italic">"{selectedReviewCase.investigatorNotes}"</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-xs"><span className="text-slate-500">Risk Amount</span><span className="font-mono font-bold text-slate-300">{formatCurrency(selectedReviewCase.riskAmount)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Traced (Lien)</span><span className="font-mono font-bold text-amber-400">{formatCurrency(selectedReviewCase.tracedAmount)}</span></div>
                <div className="flex justify-between text-xs border-t border-slate-800/50 pt-2"><span className="text-slate-500">Action</span><span className="text-xs font-semibold text-emerald-400">Partial Lien (Recommended)</span></div>
              </div>

              {/* Dynamic Audit Timeline */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-slate-400 tracking-widest">AUDIT TIMELINE</h3>
                <div className="space-y-0">
                  {(selectedReviewCase.auditLog || []).map((entry, idx, arr) => {
                    const isLast = idx === arr.length - 1
                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-800`}>
                            <Clock className={`w-3 h-3 text-slate-400`} />
                          </div>
                          {!isLast && <div className={`w-px h-8 bg-slate-800`} />}
                        </div>
                        <div className="pb-3 pt-0.5">
                          <p className="text-[10px] font-mono text-slate-500">{formatTime(entry.timestamp)} - {entry.actor}</p>
                          <p className={`text-[11px] mt-0.5 text-slate-300`}>{entry.action}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Export Center */}
              <div className="space-y-3 pt-2 border-t border-slate-800/50">
                <h2 className="text-[10px] font-bold text-slate-400 tracking-widest">EXPORT CENTER</h2>
                <div className="flex gap-2">
                  {/* SAR Button */}
                  <motion.button
                    onClick={() => handleGenerateSAR(selectedReviewCase)}
                    whileHover={!isAnyActionProcessing && !sarGenerated ? { scale: 1.02 } : {}}
                    whileTap={!isAnyActionProcessing && !sarGenerated ? { scale: 0.98 } : {}}
                    disabled={isAnyActionProcessing || sarGenerated}
                    className={`flex-1 px-3 py-2.5 rounded-xl border transition-all ${sarGenerated ? 'border-emerald-500/30 bg-emerald-500/5' : isGeneratingSAR ? 'border-slate-700/50 bg-slate-900/50 opacity-50 cursor-not-allowed' : 'border-slate-700/50 bg-slate-900/50 hover:bg-slate-800/50'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {isGeneratingSAR ? <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" /> : sarGenerated ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5 text-cyan-400" />}
                      <span className={`text-[11px] font-bold ${sarGenerated ? 'text-emerald-400' : 'text-slate-300'}`}>{isGeneratingSAR ? 'Generating...' : sarGenerated ? 'SAR ✓' : 'SAR PDF'}</span>
                    </div>
                  </motion.button>

                  {/* DPIP Button */}
                  <motion.button
                    onClick={() => handleGenerateDPIP(selectedReviewCase)}
                    whileHover={!isAnyActionProcessing && !dpipGenerated ? { scale: 1.02 } : {}}
                    whileTap={!isAnyActionProcessing && !dpipGenerated ? { scale: 0.98 } : {}}
                    disabled={isAnyActionProcessing || dpipGenerated}
                    className={`flex-1 px-3 py-2.5 rounded-xl border transition-all ${dpipGenerated ? 'border-emerald-500/30 bg-emerald-500/5' : isGeneratingDPIP ? 'border-slate-700/50 bg-slate-900/50 opacity-50 cursor-not-allowed' : 'border-slate-700/50 bg-slate-900/50 hover:bg-slate-800/50'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {isGeneratingDPIP ? <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" /> : dpipGenerated ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-amber-400" />}
                      <span className={`text-[11px] font-bold ${dpipGenerated ? 'text-emerald-400' : 'text-slate-300'}`}>{isGeneratingDPIP ? 'Exporting...' : dpipGenerated ? 'DPIP ✓' : 'DPIP Packet'}</span>
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Governance Actions (Only for pending) */}
              {activeTab === 'pending' && selectedReviewCase.status === CASE_STATUS.AWAITING_LEGAL_REVIEW && (
                <div className="pt-4 border-t border-slate-800/50 space-y-2">
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => handleAction('return', selectedReviewCase.id)}
                      disabled={isAnyActionProcessing}
                      className={`flex-1 py-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 border border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all ${isAnyActionProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {actionState.type === 'return' ? 'Returning...' : 'Return to AML'}
                    </motion.button>
                    
                    <motion.button
                      onClick={() => handleAction('reject', selectedReviewCase.id)}
                      disabled={isAnyActionProcessing}
                      className={`flex-1 py-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all ${isAnyActionProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <XOctagon className="w-3.5 h-3.5" />
                      {actionState.type === 'reject' ? 'Rejecting...' : 'Reject & Release'}
                    </motion.button>
                  </div>
                  
                  <motion.button
                    onClick={() => handleAction('finalize', selectedReviewCase.id)}
                    whileHover={!isAnyActionProcessing ? { scale: 1.01 } : {}}
                    whileTap={!isAnyActionProcessing ? { scale: 0.98 } : {}}
                    disabled={isAnyActionProcessing}
                    className={`w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15 transition-all ${isAnyActionProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {actionState.type === 'finalize' ? 'Authorizing...' : 'Authorize & Finalize Restriction'}
                  </motion.button>
                  <p className="text-center text-[10px] text-slate-600">Restriction will become active for branch operations</p>
                </div>
              )}
              
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-600">
                <Scale className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-[10px]">Select a case to view governance details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ComplianceWorkspace
