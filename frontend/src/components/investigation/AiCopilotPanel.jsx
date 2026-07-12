import { Cpu, GitCompare, History, HelpCircle, ShieldCheck } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'

export default function AiCopilotPanel({ node }) {
  const { context } = useInvestigation()
  
  const ai = node.aiAnalysis
  const revisions = context?.revisionHistory || []

  if (!ai) {
    return (
      <div className="text-center py-8 text-slate-600 font-mono text-[10px]">
        No AI Copilot telemetry available.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Classification Card */}
      <div className="p-3.5 rounded-xl border border-cyan-500/10 bg-cyan-500/5 space-y-2">
        <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">
          AI COPILOT ASSESSMENT
        </span>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Classification</span>
          <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
            {ai.aiClassification}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Confidence Match</span>
          <span className="text-xs font-bold font-mono text-cyan-400">
            {(ai.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <p className="text-xs text-slate-400 font-sans leading-relaxed border-t border-cyan-500/10 pt-2 mt-1">
          {ai.summary}
        </p>
      </div>

      {/* Evidence Claims */}
      <div className="space-y-2">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">PROVENANCE TRACKING</span>
        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
          {ai.evidence.map((ev, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 text-xs space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span className="font-bold flex items-center gap-1 text-slate-400">
                  <GitCompare className="w-2.5 h-2.5" /> {ev.source}
                </span>
                <span className="font-mono">Weight: {(ev.weight * 100).toFixed(0)}%</span>
              </div>
              <p className="text-slate-300 font-sans leading-relaxed">{ev.derivedFrom}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revision History */}
      <div className="space-y-2 border-t border-slate-800 pt-3">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">REVISION ARCHIVE</span>
        {revisions.length === 0 ? (
          <div className="text-center py-4 border border-slate-900 rounded-xl bg-slate-950/10 text-slate-600 text-[10px] font-mono">
            No revisions logged. Use reanalyze comments to refine.
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
            {revisions.map((rev, revIdx) => (
              <div key={revIdx} className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-xs space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-900 pb-1.5">
                  <span className="font-bold text-slate-400 flex items-center gap-1">
                    <History className="w-3 h-3 text-cyan-400" /> Rev V{rev.contextVersion}
                  </span>
                  <span>{new Date(rev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="space-y-1 bg-slate-900/50 p-2 rounded border border-slate-900 text-slate-400">
                  <span className="text-[9px] font-mono text-slate-600 uppercase font-semibold">Challenge focus: {rev.focusNodeId}</span>
                  <p className="italic text-slate-400">"{rev.officerComment}"</p>
                </div>
                {/* Updates */}
                <div className="space-y-1.5 pl-1.5 border-l border-cyan-500/20">
                  {rev.revisions.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[10px]">
                      <span className="text-slate-500 font-semibold">{item.nodeId} updated</span>
                      <span className="text-cyan-400 font-mono font-bold">{item.aiClassification}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
