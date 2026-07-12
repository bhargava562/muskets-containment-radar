import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, CheckSquare, XCircle, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

export default function CaseGateModal() {
  const { caseSnapshot, buildGraph, closeCaseAsFalsePositive, exitWorkspace } = useInvestigation()
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [closeReason, setCloseReason] = useState('')

  if (!caseSnapshot) return null

  const handleCloseCase = async () => {
    if (!closeReason.trim()) return
    await closeCaseAsFalsePositive(closeReason)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[100%]"
    >
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">GATEWAY DECISION</span>
              <h2 className="text-lg font-bold text-slate-200">{caseSnapshot.caseId}</h2>
            </div>
          </div>
          <button 
            onClick={exitWorkspace}
            className="text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
          >
            Cancel & Exit
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {!showCloseConfirm ? (
            <>
              {/* Alert Meta Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/50 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Target Account</span>
                  <p className="text-sm font-semibold text-slate-300">{caseSnapshot.accountId}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/50 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Account Holder</span>
                  <p className="text-sm font-semibold text-slate-300">{caseSnapshot.customerName}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/50 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Risk Amount</span>
                  <p className="text-sm font-mono font-bold text-red-400">{formatCurrency(caseSnapshot.riskAmount)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/50 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Priority Category</span>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 mt-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    {caseSnapshot.priority} / CRITICAL
                  </span>
                </div>
              </div>

              {/* Signals */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/50 space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Triage Flag Reasons</span>
                <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800/60">
                  {caseSnapshot.triggerReason}
                </p>
              </div>

              {/* Action Choices */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  onClick={() => setShowCloseConfirm(true)}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/20 hover:bg-slate-800/20 group transition-all text-left"
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-300 group-hover:text-red-400 transition-colors">Close Case</h3>
                    <p className="text-xs text-slate-500 mt-1">Mark as false positive anomaly and release hold.</p>
                  </div>
                  <XCircle className="w-5 h-5 text-slate-600 group-hover:text-red-400 transition-colors flex-shrink-0" />
                </button>

                <button
                  onClick={buildGraph}
                  className="flex items-center justify-between p-4 rounded-xl border border-cyan-500/30 hover:border-cyan-500/50 bg-cyan-500/5 hover:bg-cyan-500/10 group transition-all text-left"
                >
                  <div>
                    <h3 className="text-sm font-bold text-cyan-400">Build Suspect Graph</h3>
                    <p className="text-xs text-slate-400 mt-1">Generate multi-hop transaction flow mapping.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4 py-2">
              <h3 className="text-sm font-bold text-slate-300">Provide False Positive Rationale</h3>
              <p className="text-xs text-slate-500">
                You are closing this case without a full trace. Explain why these signals are safe.
              </p>
              <textarea
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="Reason (e.g. Verified customer KYC, amount matches business transaction profile...)"
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-slate-700 transition-colors"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCloseCase}
                  disabled={!closeReason.trim()}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-slate-900 transition-colors ${
                    closeReason.trim() ? 'bg-red-400 hover:bg-red-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  Confirm Close & Archive
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
  )
}
