import { Check, X, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react'
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

      <div className="grid grid-cols-2 gap-2">
        {VERDICT_CONFIGS.map((config) => {
          const Icon = config.icon
          const isSelected = currentVerdict === config.id
          return (
            <button
              key={config.id}
              onClick={() => updateNodeVerdict(node.nodeId, config.id)}
              className={`py-2 px-3 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
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
    </div>
  )
}
