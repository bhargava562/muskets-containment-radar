import { useMemo } from 'react'
import { CheckCircle } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'

export default function InvestigationCoverageBar() {
  const { context } = useInvestigation()

  const stats = useMemo(() => {
    if (!context || !context.nodes) return { total: 0, reviewed: 0, percent: 0 }
    
    const total = context.nodes.length
    const reviewed = context.nodes.filter(n => n.officerVerdict !== 'UNREVIEWED').length
    const percent = total > 0 ? Math.round((reviewed / total) * 100) : 0
    
    return { total, reviewed, percent }
  }, [context])

  if (!context) return null

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0">
          <CheckCircle className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold block">
            INVESTIGATION PROGRESS TRACKER
          </span>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {context.nodes?.map((n) => {
              const statusLabel =
                n.officerVerdict === 'UNREVIEWED' ? 'Pending' :
                n.officerVerdict === 'NEEDS_MORE_EVIDENCE' ? 'Needs Review' :
                'Verified'

              const statusColor =
                statusLabel === 'Verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                statusLabel === 'Needs Review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-slate-900/50 text-slate-500 border-slate-800'

              return (
                <div key={n.nodeId} className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-mono ${statusColor}`}>
                  <span className="font-bold text-slate-300">{n.nodeId}</span>
                  <span className="text-[9px] opacity-30">|</span>
                  <span>{statusLabel}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Progress Track */}
      <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-48">
        <div className="flex-1 h-1.5 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
          <div 
            className="h-full bg-cyan-400 transition-all duration-350"
            style={{ width: `${stats.percent}%` }}
          />
        </div>
        <span className="text-xs font-mono font-bold text-cyan-400 min-w-[32px] text-right">
          {stats.percent}%
        </span>
      </div>
    </div>
  )
}
