import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Calendar, User, FileText, CheckCircle, ArrowRight, X } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

export default function InvestigationSummaryPanel({ onClose }) {
  const { activeCaseId, proceedToLegal, loading } = useInvestigation()
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/investigation/${activeCaseId}/summary`)
        if (!res.ok) throw new Error('Failed to load summary report')
        const data = await res.json()
        setReport(data)
      } catch (e) {
        setError(e.message)
      }
    }
    fetchSummary()
  }, [activeCaseId, backendUrl])

  const handleProceed = async () => {
    await proceedToLegal('EMP-902')
  }

  if (error) {
    return (
      <div className="p-5 text-center text-red-400 font-mono text-xs">
        Error loading report: {error}
      </div>
    )
  }

  if (!report) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        Compiling investigation summary report...
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                AUDIT-READY SUMMARY REPORT
              </span>
              <h2 className="text-lg font-bold text-slate-200">Escalation Dossier: {report.caseId}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Recommending Officer</span>
              <p className="text-xs font-semibold text-slate-300">{report.recommendingOfficer}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Final Action Decision</span>
              <span className="inline-block text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                {report.finalAction}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase">Report Timestamp</span>
              <p className="text-xs text-slate-300 font-mono">
                {new Date(report.reportTimestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Justification */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Justification Rationale</span>
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/20 text-xs text-slate-300 italic leading-relaxed">
              "{report.rationale}"
            </div>
          </div>

          {/* Node Summary List */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">NODE DISPOSITION TRACKING</span>
            <div className="grid grid-cols-2 gap-3.5">
              {report.nodes.map((node) => (
                <div key={node.nodeId} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/10 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-200 truncate pr-2">{node.label}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      node.nodeType === 'VICTIM' ? 'bg-blue-500/15 text-blue-400' :
                      node.nodeType === 'MULE' ? 'bg-red-500/15 text-red-400' :
                      'bg-green-500/15 text-green-400'
                    }`}>
                      {node.nodeType}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mt-1">
                    <div>
                      <span className="text-slate-500 block text-[9px] font-mono uppercase">Verdict</span>
                      <span className="font-semibold">{node.officerVerdict}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] font-mono uppercase">Action Set</span>
                      <span className="font-semibold">{node.nodeAction}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Case Notes & Timeline Tabs */}
          <div className="grid grid-cols-2 gap-5 pt-2">
            {/* Case Notes Log */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">HUMAN CASE ANNOTATIONS</span>
              <div className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 space-y-3 max-h-[180px] overflow-y-auto">
                {report.caseNotes.length === 0 ? (
                  <p className="text-[10px] text-slate-600 font-mono text-center py-4">No internal case notes logged</p>
                ) : (
                  report.caseNotes.map((note) => (
                    <div key={note.noteId} className="text-[11px] border-b border-slate-900 last:border-0 pb-2.5 last:pb-0 space-y-1">
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span className="font-semibold text-slate-400">{note.author}</span>
                        <span>{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-sans">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Case Timeline */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">AUDIT LOG TRAIL</span>
              <div className="p-4 rounded-xl border border-slate-850 bg-slate-950/20 space-y-3.5 max-h-[180px] overflow-y-auto">
                {report.timeline.map((evt) => (
                  <div key={evt.eventId} className="text-[11px] flex gap-2.5">
                    <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[9px] text-slate-500 gap-4">
                        <span className="font-semibold text-slate-300">{evt.title}</span>
                        <span className="font-mono">{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-relaxed">{evt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 border border-slate-700/30 text-slate-300 transition-colors"
          >
            Review Workspace
          </button>
          <button
            onClick={handleProceed}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-500 text-slate-900 transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/10"
          >
            <span>{loading ? 'Submitting...' : 'Sign & Proceed to Legal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
