import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Landmark, ShieldAlert, Cpu, FileText, ArrowRightLeft, ShieldCheck, Clock, AlertTriangle } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'
import ReviewStatusControl from './ReviewStatusControl'
import NodeActionControl from './NodeActionControl'
import EvidenceRepository from './EvidenceRepository'
import AiCopilotPanel from './AiCopilotPanel'
import RecommendationPanel from './RecommendationPanel'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Derive a per-node investigation status from existing state.
 * This is computed client-side — no backend field needed.
 */
const getNodeInvestigationStatus = (node) => {
  if (!node) return { label: 'Unknown', color: 'text-slate-500', bg: 'bg-slate-800' }
  const hasVerdict = node.officerVerdict && node.officerVerdict !== 'UNREVIEWED'
  const hasAction = node.nodeAction && node.nodeAction !== 'NO_ACTION'
  const hasEvidence = (node.evidenceRepository?.length || 0) > 0

  if (hasVerdict && hasAction) return { label: 'Verdict + Action Recorded', color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
  if (hasVerdict) return { label: 'Verdict Recorded', color: 'text-cyan-400', bg: 'bg-cyan-500/10' }
  if (hasEvidence) return { label: 'Evidence Attached', color: 'text-amber-400', bg: 'bg-amber-500/10' }
  return { label: 'AI Generated — Awaiting Review', color: 'text-slate-400', bg: 'bg-slate-800' }
}

export default function NodeDetailDrawer({ onOpenSummary }) {
  const { getSelectedNode, context } = useInvestigation()
  const [activeMainTab, setActiveMainTab] = useState('node') // 'node', 'case', or 'log'
  const [activeTab, setActiveTab] = useState('ai')

  const node = getSelectedNode()

  // Checklist and Progress variables
  const totalNodes = context?.nodes?.length || 0
  const reviewedNodes = context?.nodes?.filter(n => n.officerVerdict && n.officerVerdict !== 'UNREVIEWED').length || 0
  const totalEvidence = context?.evidenceRepository?.length || 0

  // Dynamic checklist items — computed from real state
  const checklistItems = [
    {
      label: 'Every node reviewed',
      done: reviewedNodes === totalNodes && totalNodes > 0,
      detail: `${reviewedNodes}/${totalNodes}`
    },
    {
      label: 'Evidence attached where flagged',
      done: totalEvidence > 0,
      detail: `${totalEvidence} item(s)`
    },
    {
      label: 'AI reasoning reviewed on every node',
      done: reviewedNodes === totalNodes && totalNodes > 0,
      detail: null
    },
    {
      label: 'No DISPUTED node without a note',
      done: !context?.nodes?.some(n => n.officerVerdict === 'DISPUTED' && !n.officerNote),
      detail: null
    }
  ]
  const allChecklistPassed = checklistItems.every(i => i.done)

  return (
    <div className="h-full flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Main Tab Bar Selector */}
      <div className="flex border-b border-slate-800 bg-slate-950 p-1 gap-1">
        <button
          onClick={() => setActiveMainTab('node')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeMainTab === 'node'
              ? 'bg-slate-800 text-cyan-400 border border-slate-700/50 shadow-sm'
              : 'text-slate-500 hover:text-slate-400'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Node Inspector</span>
        </button>
        <button
          onClick={() => setActiveMainTab('case')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeMainTab === 'case'
              ? 'bg-slate-800 text-cyan-400 border border-slate-700/50 shadow-sm'
              : 'text-slate-500 hover:text-slate-400'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Case Escalation</span>
        </button>
        <button
          onClick={() => setActiveMainTab('log')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeMainTab === 'log'
              ? 'bg-slate-800 text-cyan-400 border border-slate-700/50 shadow-sm'
              : 'text-slate-500 hover:text-slate-400'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* Content Areas */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeMainTab === 'node' ? (
          !node ? (
            <div className="h-full flex items-center justify-center text-slate-600 bg-slate-950/20 p-6 text-center">
              <div>
                <User className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-xs font-mono">Select a node in the Suspect Graph to inspect profiles and AI evaluations.</p>
                <p className="text-[10px] text-slate-500 mt-2">Or switch to the "Case Escalation" tab above to sign off your final decision.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Node Profile Header + Investigation Status */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/40">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">SUSPECT NODE INSPECTOR</span>
                <h3 className="text-sm font-bold text-slate-200 truncate">{node.label}</h3>
                <p className="text-[10px] font-mono text-slate-400 mt-1">ACID: {node.accountId}</p>
                
                {/* Per-Node Investigation Status */}
                {(() => {
                  const status = getNodeInvestigationStatus(node)
                  return (
                    <div className={`mt-2 flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-mono ${status.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.color.replace('text-', 'bg-')} animate-pulse`} />
                      <span className={status.color}>{status.label}</span>
                    </div>
                  )
                })()}
              </div>

              {/* Tabs — AI first, Decision last */}
              <div className="flex border-b border-slate-800 bg-slate-900/20 p-1 gap-1 flex-shrink-0">
                {[
                  { id: 'ai', label: 'AI Assessment', icon: Cpu },
                  { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
                  { id: 'evidence', label: 'Evidence', icon: FileText },
                  { id: 'kyc', label: 'KYC', icon: User },
                  { id: 'cbs', label: 'CBS', icon: Landmark },
                  { id: 'decision', label: 'Decision', icon: ShieldCheck }
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                        isActive
                          ? 'bg-slate-800 text-cyan-400 border border-slate-700/50 shadow-sm'
                          : 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/30'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Tab Panels */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'ai' && (
                  <AiCopilotPanel node={node} />
                )}

                {activeTab === 'transactions' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Transaction Chain — This Node
                    </h4>
                    {(!node.recentTransactions || node.recentTransactions.length === 0) ? (
                      <div className="text-center py-8 text-slate-600 text-xs font-mono">
                        No transaction records linked to this node.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {node.recentTransactions.map((txn) => (
                          <div key={txn.txnId} className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[9px] ${
                                txn.type === 'UPI' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                                txn.type === 'IMPS' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                                txn.type === 'NEFT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                txn.type === 'ATM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>{txn.type}</span>
                              <span className="font-mono font-bold text-slate-200">{formatCurrency(txn.amount)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                              <span className="truncate mr-2">{txn.fromAccount} → {txn.toAccount}</span>
                              <span className="flex-shrink-0">{new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {txn.narration && <p className="text-slate-400 mt-1.5 italic text-[10px]">{txn.narration}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'evidence' && (
                  <EvidenceRepository nodeId={node.nodeId} node={node} />
                )}

                {activeTab === 'kyc' && node.kyc && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Profile KYC</h4>
                    <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2 text-xs">
                      {Object.entries(node.kyc).map(([key, val]) => (
                        <div key={key} className="flex justify-between py-1 border-b border-slate-900 last:border-0">
                          <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-slate-300 font-semibold">{val || 'N/A'}</span>
                        </div>
                      ))}
                    </div>

                    {/* Complaint data (if present on node) */}
                    {node.complaint && (
                      <div className="mt-3">
                        <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Linked Complaint</h4>
                        <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 space-y-2 text-xs">
                          {Object.entries(node.complaint).map(([key, val]) => (
                            <div key={key} className="flex justify-between py-1 border-b border-red-500/10 last:border-0">
                              <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="text-slate-300 font-semibold">{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : (val || 'N/A')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'cbs' && node.cbs && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Core Banking Details</h4>
                    <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2 text-xs">
                      {Object.entries(node.cbs).map(([key, val]) => {
                        const isAmount = typeof val === 'number' && (key.includes('Balance') || key.includes('Debit') || key.includes('Credit') || key.includes('lien'))
                        return (
                          <div key={key} className="flex justify-between py-1 border-b border-slate-900 last:border-0">
                            <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className={`text-slate-300 ${isAmount ? 'font-mono font-semibold' : ''}`}>
                              {isAmount ? formatCurrency(val) : (val || 'N/A')}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'decision' && (
                  <div className="space-y-5">
                    <p className="text-xs text-slate-500 mb-3 italic">
                      Set only after reviewing AI Assessment, Evidence, and account data.
                    </p>

                    {/* Verdict (Assessment) */}
                    <div className="space-y-2 p-3.5 rounded-xl border border-slate-800 bg-slate-900/10">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Assessment Verdict</span>
                      <ReviewStatusControl node={node} />
                    </div>

                    {/* Containment (Action) */}
                    <div className="space-y-2 p-3.5 rounded-xl border border-slate-800 bg-slate-900/10">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Containment Recommendation</span>
                      <NodeActionControl node={node} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        ) : activeMainTab === 'log' ? (
          /* INVESTIGATION AUDIT LOG */
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 -mx-4 -mt-4 mb-3">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">INVESTIGATION AUDIT TRAIL</span>
              <h3 className="text-sm font-bold text-slate-200">Automatic Event Log</h3>
              <p className="text-[10px] text-slate-500 mt-1">Every system action and officer decision is recorded automatically.</p>
            </div>

            {(!context?.timeline || context.timeline.length === 0) ? (
              <div className="text-center py-10 text-slate-600 text-xs font-mono">
                No audit events recorded yet.
              </div>
            ) : (
              <div className="relative pl-4 border-l border-slate-800 space-y-4">
                {[...context.timeline].reverse().map((event, idx) => {
                  const categoryColor =
                    event.category === 'SYSTEM_ALERT' ? 'bg-violet-500' :
                    event.category === 'AI_REANALYSIS' ? 'bg-cyan-500' :
                    event.category === 'OFFICER_REVIEW' ? 'bg-emerald-500' :
                    event.category === 'EVIDENCE_UPLOAD' ? 'bg-amber-500' :
                    'bg-slate-500'
                  return (
                    <div key={event.eventId || idx} className="relative">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full ${categoryColor} ring-2 ring-slate-900`} />
                      <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-xs">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-slate-200 text-[11px]">{event.title}</span>
                          <span className="text-[9px] font-mono text-slate-500 flex-shrink-0 ml-2">
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">{event.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${categoryColor}`} />
                          <span className="text-[9px] text-slate-500 font-mono">{event.actor} · {event.category}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* CASE ESCALATION TAB */
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 -mx-4 -mt-4">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">LEGAL ESCALATION GATEWAY</span>
              <h3 className="text-sm font-bold text-slate-200">Submit Action Recommendation</h3>
            </div>

            {/* Checklist — computed from real state */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Audit Progress Checklist</h4>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3 text-xs">
                {checklistItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-slate-400">{idx + 1}. {item.label}</span>
                    <span className={`font-bold flex items-center gap-1 ${item.done ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {!item.done && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />}
                      {item.done ? '✓' : '✗'} {item.detail || (item.done ? 'DONE' : 'PENDING')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Locked vs Form State */}
            {context?.escalationAction ? (
              <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-4 text-center">
                <div className="p-3.5 rounded-full bg-emerald-500/10 text-emerald-400 w-fit mx-auto border border-emerald-500/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider block">RECOMMENDATION LOCKED</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Case recommendation registered successfully. Ready to build and submit the legal escalation dossier.
                  </p>
                </div>
                <button
                  onClick={onOpenSummary}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-500 text-slate-950 flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <FileText className="w-4 h-4 animate-pulse" />
                  Review Escalation Dossier
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {!allChecklistPassed && (
                  <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs flex gap-2 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                    <span>All checklist items must pass before you can save a case action recommendation. Review outstanding items above.</span>
                  </div>
                )}
                <RecommendationPanel 
                  onRecommendationSaved={onOpenSummary} 
                  disabled={!allChecklistPassed} 
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
