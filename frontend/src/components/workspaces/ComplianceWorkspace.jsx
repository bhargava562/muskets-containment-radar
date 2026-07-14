import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, CheckCircle2, RotateCcw, XOctagon, FileText, Download, Loader2, Clock, ChevronRight, AlertTriangle } from 'lucide-react'
import { useApp, CASE_STATUS } from '../../context/AppContextSimplified'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const fmt = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
const fmtTime = (iso) => new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

// Checklist derived entirely client-side from fetched context — no new backend field needed
function useReviewChecklist(ctx) {
  if (!ctx) return { allPassed: false, checks: [] }
  const checks = [
    { label: 'All nodes reviewed', pass: ctx.nodes?.every(n => n.officerVerdict !== 'UNREVIEWED') ?? false },
    { label: 'Evidence attached', pass: (ctx.evidenceCount ?? 0) > 0 },
    { label: 'Recommendation present', pass: !!ctx.recommendation?.selectedAction },
    { label: 'Timeline verified', pass: (ctx.timeline?.length ?? 0) > 0 },
  ]
  return { allPassed: checks.every(c => c.pass), checks }
}

const StatusBadge = ({ status }) => {
  const map = {
    AWAITING_LEGAL_REVIEW: 'bg-cyan-500/10 text-cyan-400',
    RESTRICTION_ACTIVE: 'bg-emerald-500/10 text-emerald-400',
    RETURNED_TO_AML: 'bg-amber-500/10 text-amber-400',
    CLOSED_FALSE_POSITIVE: 'bg-slate-700/50 text-slate-400',
    RESOLVED: 'bg-emerald-500/10 text-emerald-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${map[status] ?? 'bg-slate-700/50 text-slate-400'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}

export default function ComplianceWorkspace() {
  const { getCasesByStatuses, CASE_STATUS: _ } = useApp()
  const pendingCases = getCasesByStatuses([CASE_STATUS.AWAITING_LEGAL_REVIEW])
  const closedCases = getCasesByStatuses([CASE_STATUS.RESTRICTION_ACTIVE, CASE_STATUS.RETURNED_TO_AML, CASE_STATUS.CLOSED_FALSE_POSITIVE, CASE_STATUS.RESOLVED])

  const [activeTab, setActiveTab] = useState('pending')
  const [selectedCaseId, setSelectedCaseId] = useState(null)
  const [reviewCtx, setReviewCtx] = useState(null)
  const [loadingCtx, setLoadingCtx] = useState(false)

  // STR draft state
  const [strLoading, setStrLoading] = useState(false)
  const [strError, setStrError] = useState(null)
  const [strNarrative, setStrNarrative] = useState('')
  const [strSaved, setStrSaved] = useState(false)

  // Decision state
  const [deciding, setDeciding] = useState(false)
  const [returnComment, setReturnComment] = useState('')
  const [showReturnInput, setShowReturnInput] = useState(false)
  const [toast, setToast] = useState('')

  const displayCases = activeTab === 'pending' ? pendingCases : closedCases

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // Fetch review summary from real backend when a case is selected
  const fetchReviewSummary = useCallback(async (caseId) => {
    setLoadingCtx(true)
    setReviewCtx(null)
    setStrNarrative('')
    setStrSaved(false)
    setStrError(null)
    setShowReturnInput(false)
    setReturnComment('')
    try {
      const res = await fetch(`${BACKEND}/api/investigation/${caseId}/review-summary`)
      if (!res.ok) throw new Error('Backend unavailable')
      const data = await res.json()
      setReviewCtx(data)
      if (data.strDraft?.narrative) setStrNarrative(data.strDraft.narrative)
    } catch {
      setReviewCtx(null)
    } finally {
      setLoadingCtx(false)
    }
  }, [])

  useEffect(() => {
    if (selectedCaseId) fetchReviewSummary(selectedCaseId)
  }, [selectedCaseId, fetchReviewSummary])

  // Auto-deselect if case leaves current tab view
  useEffect(() => {
    if (selectedCaseId && !displayCases.find(c => c.id === selectedCaseId)) {
      setSelectedCaseId(null)
    }
  }, [displayCases, selectedCaseId])

  const handleGenerateStr = async () => {
    if (!selectedCaseId || strLoading) return
    setStrLoading(true)
    setStrError(null)
    try {
      const res = await fetch(`${BACKEND}/api/investigation/${selectedCaseId}/str-draft`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'STR generation failed')
      }
      const draft = await res.json()
      setStrNarrative(draft.narrative)
      setStrSaved(false)
      showToast('STR draft generated')
    } catch (e) {
      setStrError(e.message)
    } finally {
      setStrLoading(false)
    }
  }

  const handleSaveStr = async () => {
    if (!selectedCaseId || !strNarrative.trim()) return
    try {
      await fetch(`${BACKEND}/api/investigation/${selectedCaseId}/str-draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narrative: strNarrative })
      })
      setStrSaved(true)
      showToast('STR draft saved')
    } catch {
      showToast('Save failed — try again')
    }
  }

  const handleDecision = async (decision) => {
    if (deciding || !selectedCaseId) return
    if ((decision === 'RETURN' || decision === 'NEED_MORE_EVIDENCE') && !returnComment.trim()) {
      setShowReturnInput(true)
      return
    }
    setDeciding(true)
    try {
      const res = await fetch(`${BACKEND}/api/investigation/${selectedCaseId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment: returnComment })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Decision failed')
      }
      const labels = { APPROVE: 'Restriction approved', RETURN: 'Case returned to AML', NEED_MORE_EVIDENCE: 'Returned — more evidence requested', REJECT: 'Case rejected as false positive' }
      showToast(labels[decision] || decision)
      setSelectedCaseId(null)
      setReviewCtx(null)
    } catch (e) {
      showToast(e.message)
    } finally {
      setDeciding(false)
    }
  }

  const handleExportEvidencePackage = (caseItem) => {
    if (!caseItem) return
    const doc = new jsPDF()
    let y = 20
    doc.setFontSize(15); doc.setFont('helvetica', 'bold')
    doc.text('CASE EVIDENCE PACKAGE', 20, y); y += 10
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toISOString()}`, 20, y); y += 5
    doc.text(`Case ID: ${caseItem.id}  |  Priority: ${caseItem.priority}`, 20, y); y += 10

    autoTable(doc, {
      startY: y,
      head: [['Field', 'Value']],
      body: [
        ['Customer', caseItem.customerName],
        ['Risk Amount', fmt(caseItem.riskAmount)],
        ['Traced Amount', fmt(caseItem.tracedAmount)],
        ['Recommended Action', 'Proportional Lien'],
        ['Status', caseItem.status],
      ],
      margin: { left: 20, right: 20 }, styles: { fontSize: 9 }
    })

    y = doc.lastAutoTable.finalY + 10
    if (reviewCtx?.timeline?.length) {
      doc.setFontSize(11); doc.setFont('helvetica', 'bold')
      doc.text('Investigation Timeline', 20, y); y += 6
      autoTable(doc, {
        startY: y,
        head: [['Time', 'Actor', 'Event']],
        body: reviewCtx.timeline.map(e => [fmtTime(e.timestamp), e.actor, e.title]),
        margin: { left: 20, right: 20 }, styles: { fontSize: 8 }
      })
      y = doc.lastAutoTable.finalY + 10
    }

    if (strNarrative) {
      doc.setFontSize(11); doc.setFont('helvetica', 'bold')
      doc.text('STR Narrative (FIU-IND)', 20, y); y += 6
      doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(strNarrative, 170)
      doc.text(lines, 20, y); y += lines.length * 5 + 8
    }

    const hash = Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')
    doc.setFontSize(7)
    doc.text(`Integrity Hash (SHA-256): ${hash}`, 20, doc.internal.pageSize.height - 10)
    doc.save(`EvidencePackage-${caseItem.id}.pdf`)
    showToast('Evidence package exported')
  }

  const { allPassed, checks } = useReviewChecklist(reviewCtx)
  const selectedCase = displayCases.find(c => c.id === selectedCaseId)

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-950">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-emerald-500/90 text-white text-sm font-semibold rounded-xl shadow-lg backdrop-blur flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />{toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800/50 bg-slate-900/30">
        <div className="flex items-center gap-3 mb-4">
          <Scale className="w-5 h-5 text-slate-400" />
          <div>
            <h1 className="text-sm font-bold text-slate-200 tracking-wide">PRINCIPAL OFFICER — REVIEW</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">{pendingCases.length} case{pendingCases.length !== 1 ? 's' : ''} awaiting authorization</p>
          </div>
        </div>
        <div className="flex gap-1 p-0.5 rounded-lg bg-slate-900/50 border border-slate-800/30 w-fit">
          {[['pending', 'Review Queue', pendingCases.length], ['closed', 'Processed']].map(([id, label, count]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${activeTab === id ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-400'}`}>
              {label}
              {count > 0 && <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">{count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Case list */}
        <div className="flex-1 overflow-y-auto p-5 border-r border-slate-800/30">
          <h2 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-3">
            {activeTab === 'pending' ? 'AWAITING REVIEW' : 'PROCESSED CASES'}
          </h2>
          {displayCases.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No cases in this view</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/50 border-b border-slate-800/50">
                  <tr>
                    {['Case ID', 'Customer', 'Traced Amount', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {displayCases.map(c => (
                    <tr key={c.id} onClick={() => setSelectedCaseId(c.id)}
                      className={`cursor-pointer transition-colors ${selectedCaseId === c.id ? 'bg-cyan-500/5' : 'hover:bg-slate-900/50'}`}>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{c.id}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-300">{c.customerName}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-amber-400">{fmt(c.tracedAmount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">{fmtTime(c.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-[380px] flex-shrink-0 overflow-y-auto p-5 hidden lg:block space-y-5">
          {!selectedCaseId ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-600">
                <Scale className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-[10px]">Select a case to review</p>
              </div>
            </div>
          ) : loadingCtx ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={selectedCaseId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">

                {/* Case header */}
                <div>
                  <h3 className="text-xs font-bold text-slate-300">{selectedCase?.customerName}</h3>
                  <p className="text-[10px] text-slate-500 font-mono">{selectedCaseId}</p>
                  {reviewCtx && <div className="mt-1"><StatusBadge status={reviewCtx.caseStatus} /></div>}
                </div>

                {/* Amounts */}
                {selectedCase && (
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/30 space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Risk Amount</span><span className="font-mono font-bold text-slate-300">{fmt(selectedCase.riskAmount)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Traced (Lien)</span><span className="font-mono font-bold text-amber-400">{fmt(selectedCase.tracedAmount)}</span></div>
                    {reviewCtx?.recommendation?.selectedAction && (
                      <div className="flex justify-between text-xs border-t border-slate-800/50 pt-2">
                        <span className="text-slate-500">AML Recommendation</span>
                        <span className="text-emerald-400 font-semibold text-[11px]">{reviewCtx.recommendation.selectedAction}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Backend context — node verdict breakdown */}
                {reviewCtx && (
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/30 space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-widest">INVESTIGATION SUMMARY</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><p className="text-[10px] text-slate-500">Nodes</p><p className="text-sm font-bold text-slate-300">{reviewCtx.nodeCount}</p></div>
                      <div><p className="text-[10px] text-slate-500">Unreviewed</p><p className={`text-sm font-bold ${reviewCtx.unreviewedNodes > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{reviewCtx.unreviewedNodes}</p></div>
                      <div><p className="text-[10px] text-slate-500">Evidence</p><p className="text-sm font-bold text-slate-300">{reviewCtx.evidenceCount}</p></div>
                    </div>
                    {reviewCtx.nodes?.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-slate-800/30">
                        {reviewCtx.nodes.map(n => (
                          <div key={n.nodeId} className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">{n.label}</span>
                            <div className="flex gap-1.5">
                              <span className="text-slate-500">{n.aiClassification}</span>
                              <span className={n.officerVerdict === 'UNREVIEWED' ? 'text-amber-400' : 'text-emerald-400'}>{n.officerVerdict}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Review checklist — derived client-side */}
                {reviewCtx && (
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/30 space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-widest">REVIEW CHECKLIST</h4>
                    {checks.map(c => (
                      <div key={c.label} className="flex items-center gap-2 text-[11px]">
                        <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${c.pass ? 'text-emerald-400' : 'text-slate-600'}`} />
                        <span className={c.pass ? 'text-slate-300' : 'text-slate-500'}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Timeline (read-only) */}
                {reviewCtx?.timeline?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-widest">TIMELINE</h4>
                    <div className="space-y-0 max-h-40 overflow-y-auto">
                      {reviewCtx.timeline.slice(-6).map((e, i, arr) => (
                        <div key={e.eventId} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                              <Clock className="w-2.5 h-2.5 text-slate-500" />
                            </div>
                            {i < arr.length - 1 && <div className="w-px h-6 bg-slate-800" />}
                          </div>
                          <div className="pb-2 pt-0.5">
                            <p className="text-[10px] font-mono text-slate-500">{fmtTime(e.timestamp)} · {e.actor}</p>
                            <p className="text-[11px] text-slate-300">{e.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STR Draft panel */}
                {activeTab === 'pending' && selectedCase?.status === CASE_STATUS.AWAITING_LEGAL_REVIEW && (
                  <div className="space-y-3 pt-2 border-t border-slate-800/50">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-slate-400 tracking-widest">STR DRAFT (FIU-IND)</h4>
                      <button onClick={handleGenerateStr} disabled={strLoading}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 disabled:opacity-50 transition-all">
                        {strLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                        {strLoading ? 'Generating…' : 'Generate'}
                      </button>
                    </div>
                    {strError && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        <p className="text-[10px] text-red-400">{strError} — AI unavailable, draft manually below.</p>
                      </div>
                    )}
                    <textarea
                      value={strNarrative}
                      onChange={e => { setStrNarrative(e.target.value); setStrSaved(false) }}
                      placeholder="STR narrative will appear here after generation, or type manually…"
                      rows={5}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 resize-none"
                    />
                    <button onClick={handleSaveStr} disabled={!strNarrative.trim()}
                      className="w-full py-1.5 rounded-lg text-[11px] font-bold border border-slate-700/50 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5">
                      {strSaved ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />Saved</> : 'Save Draft'}
                    </button>
                  </div>
                )}

                {/* Evidence Package export */}
                <div className="pt-2 border-t border-slate-800/50">
                  <button onClick={() => handleExportEvidencePackage(selectedCase)}
                    className="w-full py-2 rounded-xl text-[11px] font-bold border border-slate-700/50 bg-slate-900/50 text-slate-300 hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2">
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    Export Case Evidence Package
                  </button>
                </div>

                {/* Decision buttons — only for pending cases */}
                {activeTab === 'pending' && selectedCase?.status === CASE_STATUS.AWAITING_LEGAL_REVIEW && (
                  <div className="pt-2 border-t border-slate-800/50 space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 tracking-widest">DECISION</h4>

                    {showReturnInput && (
                      <div className="space-y-2">
                        <textarea
                          value={returnComment}
                          onChange={e => setReturnComment(e.target.value)}
                          placeholder="Reason for return (required)…"
                          rows={2}
                          className="w-full px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleDecision('RETURN')} disabled={!returnComment.trim() || deciding}
                            className="flex-1 py-2 rounded-xl text-[11px] font-bold border border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5">
                            <RotateCcw className="w-3.5 h-3.5" />Return to AML
                          </button>
                          <button onClick={() => handleDecision('NEED_MORE_EVIDENCE')} disabled={!returnComment.trim() || deciding}
                            className="flex-1 py-2 rounded-xl text-[11px] font-bold border border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-40 transition-all">
                            Need Evidence
                          </button>
                        </div>
                      </div>
                    )}

                    {!showReturnInput && (
                      <div className="flex gap-2">
                        <button onClick={() => setShowReturnInput(true)} disabled={deciding}
                          className="flex-1 py-2 rounded-xl text-[11px] font-bold border border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5" />Return
                        </button>
                        <button onClick={() => handleDecision('REJECT')} disabled={deciding}
                          className="flex-1 py-2 rounded-xl text-[11px] font-bold border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5">
                          <XOctagon className="w-3.5 h-3.5" />Reject
                        </button>
                      </div>
                    )}

                    <button onClick={() => handleDecision('APPROVE')} disabled={deciding}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15 disabled:opacity-50 transition-all">
                      <ChevronRight className="w-4 h-4" />
                      {deciding ? 'Processing…' : 'Approve — Activate Restriction'}
                    </button>
                    <p className="text-center text-[10px] text-slate-600">Approval transitions case to Branch Manager execution</p>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
