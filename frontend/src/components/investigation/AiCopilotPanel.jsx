import { Cpu, GitCompare, History, ShieldAlert, Sparkles, Activity, Link2, Info } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'

export default function AiCopilotPanel({ node }) {
  const { context } = useInvestigation()
  
  const ai = node.aiAnalysis
  const revisions = context?.aiRevisionHistory || [] // Corrected key to match seed JSON

  if (!ai) {
    return (
      <div className="text-center py-12 text-slate-600 font-mono text-xs">
        No AI Copilot telemetry available.
      </div>
    )
  }

  // Derive risk score from confidence
  const riskScore = Math.round(ai.confidence * 100)

  // Derive relationship explanation based on node type and edges
  const getGraphRelationship = () => {
    if (node.nodeType === 'VICTIM') {
      return 'Victim account initiating the transaction stream. Flagged as primary source of contested funds.'
    }
    if (node.nodeType === 'MULE') {
      return 'Relay node layering funds from V1 (Victim). Exhibits rapid pass-through velocity and high concentration of downstream disbursements.'
    }
    if (node.nodeType === 'MERCHANT') {
      return 'Escrow endpoint settlement node. Receives standard batch payouts. Lower risk of direct identity theft involvement.'
    }
    return 'Secondary counterparty linked through layering transactions.'
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* Classification & Scores */}
      <div className="p-4 rounded-xl border border-cyan-500/10 bg-cyan-500/5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> AI Classification
          </span>
          <span className="text-[10px] font-bold font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded uppercase">
            {ai.aiClassification}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-cyan-500/10 pt-3">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Risk Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono text-slate-200">{riskScore}</span>
              <span className="text-[10px] text-slate-500 font-mono">/100</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono text-slate-500 uppercase">Match Confidence</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono text-cyan-400">{(ai.confidence * 100).toFixed(0)}</span>
              <span className="text-[10px] text-cyan-500/70 font-mono">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Reasoning */}
      <div className="space-y-1.5">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
          Model Reasoning
        </span>
        <p className="text-xs text-slate-300 font-sans leading-relaxed bg-slate-950/20 border border-slate-900 rounded-xl p-3.5">
          {ai.summary}
        </p>
      </div>

      {/* Recommended Investigator Action */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/20 flex gap-3">
        <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Recommended Action</span>
          <p className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            {ai.recommendedAction || 'Monitor Activity'}
          </p>
        </div>
      </div>

      {/* Relationship Explanation */}
      <div className="space-y-1.5">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
          Graph Relationship
        </span>
        <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/20 border border-slate-900 rounded-xl p-3.5">
          {getGraphRelationship()}
        </p>
      </div>

      {/* Revision History */}
      {revisions.length > 0 && (
        <div className="space-y-2 border-t border-slate-900 pt-4">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">REVISION HISTORY</span>
          <div className="space-y-3">
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
        </div>
      )}
    </div>
  )
}
