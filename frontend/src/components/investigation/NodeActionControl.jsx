import { Shield, Eye, FileSearch, Lock, CircleSlash, ArrowUpRight } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'

const ACTION_CONFIGS = [
  { id: 'NO_ACTION', label: 'No Action', icon: CircleSlash, color: 'hover:text-slate-400 hover:bg-slate-800/40' },
  { id: 'MONITOR', label: 'Monitor Account', icon: Eye, color: 'hover:text-amber-400 hover:bg-amber-500/5' },
  { id: 'BRANCH_VERIFICATION', label: 'Branch Verification', icon: FileSearch, color: 'hover:text-blue-400 hover:bg-blue-500/5' },
  { id: 'PARTIAL_LIEN', label: 'Partial Lien', icon: Shield, color: 'hover:text-cyan-400 hover:bg-cyan-500/5' },
  { id: 'FULL_FREEZE', label: 'Full Freeze', icon: Lock, color: 'hover:text-red-400 hover:bg-red-500/5' },
  { id: 'ESCALATE', label: 'Escalate hop', icon: ArrowUpRight, color: 'hover:text-purple-400 hover:bg-purple-500/5' }
]

export default function NodeActionControl({ node }) {
  const { updateNodeAction } = useInvestigation()
  const currentAction = node.nodeAction || 'NO_ACTION'

  return (
    <div className="space-y-3.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 font-mono">Current Action:</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
          currentAction === 'NO_ACTION' ? 'bg-slate-800 text-slate-400 border border-slate-700/50' :
          currentAction === 'MONITOR' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
          currentAction === 'BRANCH_VERIFICATION' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
          currentAction === 'PARTIAL_LIEN' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
          currentAction === 'FULL_FREEZE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
          'bg-purple-500/20 text-purple-400 border border-purple-500/30'
        }`}>
          {currentAction}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ACTION_CONFIGS.map((config) => {
          const Icon = config.icon
          const isSelected = currentAction === config.id
          return (
            <button
              key={config.id}
              onClick={() => updateNodeAction(node.nodeId, config.id)}
              className={`py-2 px-3 rounded-lg border text-[10px] font-bold flex items-center justify-start gap-2.5 transition-all ${
                isSelected
                  ? 'bg-slate-850 ring-1 ring-cyan-500/50 border-cyan-500/40 text-slate-200 shadow-inner'
                  : `bg-slate-950/20 border-slate-900 text-slate-400 ${config.color}`
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{config.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
