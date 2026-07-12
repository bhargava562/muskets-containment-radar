import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, FileText, AlertCircle } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'

const ESCALATION_ACTIONS = [
  { id: 'NO_ACTION', label: 'Close — No Further Action' },
  { id: 'MONITOR', label: 'Keep Open under Monitoring' },
  { id: 'BRANCH_VERIFICATION', label: 'Forward to Branch Verification' },
  { id: 'PARTIAL_LIEN', label: 'Apply Partial Lien Hold' },
  { id: 'ESCALATE', label: 'Escalate to Principal/Legal Officer' }
]

export default function RecommendationPanel({ onRecommendationSaved, disabled }) {
  const { context, submitCaseRecommendation } = useInvestigation()
  const [action, setAction] = useState('ESCALATE')
  const [rationale, setRationale] = useState('')
  const [officerId, setOfficerId] = useState('EMP-902')
  const [submitting, setSubmitting] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    if (!rationale.trim() || !officerId.trim() || submitting) return
    setSubmitting(true)
    try {
      await submitCaseRecommendation(action, rationale.trim(), officerId.trim())
      if (onRecommendationSaved) onRecommendationSaved()
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">
            CASE REVIEW GATEWAY
          </span>
          <h4 className="text-xs font-semibold text-slate-300">
            Formulate Final Action Recommendation
          </h4>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Action Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-slate-500 uppercase">Recommended Escalation Action</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-slate-700"
          >
            {ESCALATION_ACTIONS.map((act) => (
              <option key={act.id} value={act.id}>
                {act.label}
              </option>
            ))}
          </select>
        </div>

        {/* Officer ID */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-slate-500 uppercase">Investigating Officer Employee ID</label>
          <input
            type="text"
            value={officerId}
            onChange={(e) => setOfficerId(e.target.value)}
            placeholder="e.g. EMP-902"
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-slate-700"
          />
        </div>

        {/* Rationale Textarea */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-slate-500 uppercase">Justification & Escalation Rationale</label>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="State evidence gathered, counterparties confirmed, and justification for containment action..."
            rows={3}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-slate-700"
          />
        </div>

        <button
          type="submit"
          disabled={disabled || !rationale.trim() || !officerId.trim() || submitting}
          className={`w-full py-2.5 rounded-xl text-xs font-bold text-slate-900 transition-colors flex items-center justify-center gap-2 ${
            !disabled && rationale.trim() && officerId.trim() && !submitting
              ? 'bg-cyan-400 hover:bg-cyan-500 shadow-md'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{submitting ? 'Saving...' : 'Lock Recommendation'}</span>
        </button>
      </form>
    </div>
  )
}
