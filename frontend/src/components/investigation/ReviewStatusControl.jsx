import { useState } from 'react'
import { Check, X, ShieldAlert, CheckCircle, HelpCircle, MessageSquare } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'

const VERDICT_CONFIGS = [
  { id: 'CONFIRMED', label: 'Confirm AI Anomaly', icon: Check, color: 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20' },
  { id: 'DISPUTED', label: 'Dispute Anomaly', icon: X, color: 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' },
  { id: 'CLEARED', label: 'Clear Account', icon: CheckCircle, color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20' },
  { id: 'NEEDS_MORE_EVIDENCE', label: 'Needs Evidence', icon: HelpCircle, color: 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' }
]

export default function ReviewStatusControl({ node }) {
  const { updateNodeVerdict } = useInvestigation()
  const currentVerdict = node.officerVerdict || 'UNREVIEWED'

  // Blocking pattern: DISPUTED verdict requires a note before submission
  const [pendingDispute, setPendingDispute] = useState(false)
  const [disputeNote, setDisputeNote] = useState(node.officerNote || '')

  const handleVerdictClick = (verdictId) => {
    if (verdictId === 'DISPUTED') {
      // Enter pending state — don't fire immediately
      setPendingDispute(true)
      setDisputeNote('')
    } else {
      // All other verdicts fire immediately with officerNote: null
      setPendingDispute(false)
      updateNodeVerdict(node.nodeId, verdictId, null)
    }
  }

  const confirmDispute = () => {
    if (!disputeNote.trim()) return // must have a note
    updateNodeVerdict(node.nodeId, 'DISPUTED', disputeNote.trim())
    setPendingDispute(false)
  }

  const cancelDispute = () => {
    setPendingDispute(false)
    setDisputeNote('')
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 font-mono">Current Assessment:</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
          currentVerdict === 'CONFIRMED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          currentVerdict === 'DISPUTED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
          currentVerdict === 'CLEARED' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
          currentVerdict === 'NEEDS_MORE_EVIDENCE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
          'bg-slate-800 text-slate-400 border border-slate-700/50'
        }`}>
          {currentVerdict}
        </span>
      </div>

      {/* Show existing officer note if present */}
      {currentVerdict === 'DISPUTED' && node.officerNote && !pendingDispute && (
        <div className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 text-xs">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-3 h-3 text-red-400" />
            <span className="text-[9px] font-mono text-red-400 uppercase">Dispute Reason</span>
          </div>
          <p className="text-slate-300 italic text-[11px] leading-relaxed">{node.officerNote}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {VERDICT_CONFIGS.map((config) => {
          const Icon = config.icon
          const isSelected = currentVerdict === config.id
          return (
            <button
              key={config.id}
              onClick={() => handleVerdictClick(config.id)}
              disabled={pendingDispute && config.id !== 'DISPUTED'}
              className={`py-2 px-3 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                pendingDispute && config.id !== 'DISPUTED' ? 'opacity-30 cursor-not-allowed' :
                isSelected
                  ? 'bg-slate-850 ring-1 ring-cyan-500/50 border-cyan-500/40 text-slate-200'
                  : `bg-slate-950/20 border-slate-900 ${config.color}`
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{config.label}</span>
            </button>
          )
        })}
      </div>

      {/* Blocking DISPUTED textarea — appears when DISPUTED is clicked, verdict doesn't fire until confirmed */}
      {pendingDispute && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 space-y-2.5 animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-mono text-red-400 uppercase font-bold">Dispute Reason Required</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            You must document why you disagree with the AI's assessment before the dispute verdict is recorded.
          </p>
          <textarea
            value={disputeNote}
            onChange={(e) => setDisputeNote(e.target.value)}
            placeholder="Explain why you are disputing the AI classification..."
            rows={3}
            className="w-full p-2.5 rounded-lg border border-red-500/20 bg-slate-950/60 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500/40 resize-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={confirmDispute}
              disabled={!disputeNote.trim()}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                disputeNote.trim()
                  ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              Confirm Dispute
            </button>
            <button
              onClick={cancelDispute}
              className="py-2 px-4 rounded-lg text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-400 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
