import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Landmark, ShieldAlert, Cpu, Layers, FileText } from 'lucide-react'
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

export default function NodeDetailDrawer({ onOpenSummary }) {
  const { getSelectedNode, context } = useInvestigation()
  const [activeMainTab, setActiveMainTab] = useState('node') // 'node' or 'case'
  const [activeTab, setActiveTab] = useState('overview')

  const node = getSelectedNode()

  // Checklist and Progress variables
  const totalNodes = context?.nodes?.length || 0
  const reviewedNodes = context?.nodes?.filter(n => n.officerVerdict && n.officerVerdict !== 'UNREVIEWED').length || 0
  const isAllNodesReviewed = totalNodes > 0 && reviewedNodes === totalNodes
  const totalEvidence = context?.evidenceRepository?.length || 0

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
              {/* Node Profile Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/40">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">SUSPECT NODE INSPECTOR</span>
                <h3 className="text-sm font-bold text-slate-200 truncate">{node.label}</h3>
                <p className="text-[10px] font-mono text-slate-400 mt-1">ACID: {node.accountId}</p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-800 bg-slate-900/20 p-1 gap-1 flex-shrink-0">
                {[
                  { id: 'overview', label: 'Overview', icon: Layers },
                  { id: 'kyc', label: 'KYC', icon: User },
                  { id: 'cbs', label: 'CBS', icon: Landmark },
                  { id: 'evidence', label: 'Evidence', icon: FileText },
                  { id: 'ai', label: 'AI Copilot', icon: Cpu }
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
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    {/* Verdict (Assessment) */}
                    <div className="space-y-2 p-3.5 rounded-xl border border-slate-800 bg-slate-900/10">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Assessment Verdict</span>
                      <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                        Record your independent validation of the AI's classification for this node.
                      </p>
                      <ReviewStatusControl node={node} />
                    </div>

                    {/* Containment (Action) */}
                    <div className="space-y-2 p-3.5 rounded-xl border border-slate-800 bg-slate-900/10">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Containment Recommendation</span>
                      <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                        Approve immediate, proportional containment action for this specific account.
                      </p>
                      <NodeActionControl node={node} />
                    </div>
                  </div>
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
                  </div>
                )}

                {activeTab === 'cbs' && node.cbs && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Core Banking Details</h4>
                    <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-2 text-xs">
                      {Object.entries(node.cbs).map(([key, val]) => {
                        const isAmount = typeof val === 'number' && (key.includes('Balance') || key.includes('Debit') || key.includes('Credit'))
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

                {activeTab === 'evidence' && (
                  <EvidenceRepository nodeId={node.nodeId} />
                )}

                {activeTab === 'ai' && (
                  <AiCopilotPanel node={node} />
                )}
              </div>
            </div>
          )
        ) : (
          /* CASE ESCALATION TAB */
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 -mx-4 -mt-4">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">LEGAL ESCALATION GATEWAY</span>
              <h3 className="text-sm font-bold text-slate-200">Submit Action Recommendation</h3>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Audit Progress Checklist</h4>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">1. Flagged Alert Reasons</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">✓ VERIFIED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">2. Suspect Graph Layout</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">✓ BUILT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">3. Node Reviews Completed</span>
                  <span className={`font-bold flex items-center gap-1 ${isAllNodesReviewed ? "text-emerald-400" : "text-amber-400"}`}>
                    {!isAllNodesReviewed && <ShieldAlert className="w-3.5 h-3.5 text-amber-500 animate-pulse" />}
                    {reviewedNodes} / {totalNodes}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">4. Evidence Uploaded</span>
                  <span className="text-cyan-400 font-bold font-mono">
                    {totalEvidence} items
                  </span>
                </div>
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
                {!isAllNodesReviewed && (
                  <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs flex gap-2 leading-relaxed">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                    <span>All suspect graph nodes must be individually reviewed (verdict set) before you can save a case action recommendation.</span>
                  </div>
                )}
                <RecommendationPanel 
                  onRecommendationSaved={onOpenSummary} 
                  disabled={!isAllNodesReviewed} 
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
