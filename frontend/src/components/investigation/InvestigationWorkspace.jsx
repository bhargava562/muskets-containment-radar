import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, FileText, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'
import CaseGateModal from './CaseGateModal'
import CaseOverviewRail from './CaseOverviewRail'
import SuspectGraphCanvas from './SuspectGraphCanvas'
import NodeDetailDrawer from './NodeDetailDrawer'
import ReviewCommentBar from './ReviewCommentBar'
import InvestigationCoverageBar from './InvestigationCoverageBar'
import RecommendationPanel from './RecommendationPanel'
import InvestigationSummaryPanel from './InvestigationSummaryPanel'

export default function InvestigationWorkspace() {
  const { 
    activeCaseId, 
    caseSnapshot, 
    context, 
    loading, 
    error, 
    exitWorkspace,
    refreshContext,
    selectedNodeId
  } = useInvestigation()

  const [showSummary, setShowSummary] = useState(false)
  const [recommendationSaved, setRecommendationSaved] = useState(false)

  // 1. If no case is active, render nothing (MainLayout handles it)
  if (!activeCaseId) return null

  // 2. If case started but graph is not built yet (status is PENDING_TRIAGE), render the Gate Modal
  const isPendingTriage = caseSnapshot?.status === 'PENDING_TRIAGE' && !context

  return (
    <div className="h-screen w-full bg-slate-950 font-sans flex flex-col text-slate-200 select-none overflow-hidden relative">
      {/* Top Banner Control Bar */}
      <header className="h-14 border-b border-slate-900 bg-slate-950 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={exitWorkspace}
            className="p-1.5 rounded-lg border border-slate-900 hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-4 w-[1px] bg-slate-800" />
          <h1 className="text-sm font-bold text-slate-300 tracking-wider">
            AML Officer Containment & Investigation Workcanvas
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshContext()}
            className="p-2 rounded-lg border border-slate-900 hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 text-[10px] font-mono font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </header>

      {/* Main Workspace Panels */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left: Overview Rail */}
        <CaseOverviewRail />

        {/* Center Canvas */}
        <main className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden min-w-0">
          {/* Top Progress bar */}
          <InvestigationCoverageBar />

          {/* Graph view / Gate Decision Modal */}
          <div className="flex-1 min-h-0 relative flex items-center justify-center">
            {isPendingTriage ? (
              <CaseGateModal />
            ) : (
              <>
                <SuspectGraphCanvas />
                {!selectedNodeId && (
                  <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-4 py-2 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono flex items-center gap-2 pointer-events-none z-10 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Select a node to inspect
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom AI Comment feedback */}
          <ReviewCommentBar />
        </main>

        {/* Right: Drawer Inspect tabs */}
        <AnimatePresence>
          {selectedNodeId && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex-shrink-0 border-l border-slate-900/60 bg-slate-950/20 overflow-hidden flex flex-col h-full"
            >
              <div className="w-[340px] p-4 h-full flex flex-col min-h-0">
                <NodeDetailDrawer onOpenSummary={() => setShowSummary(true)} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Error Banners */}
      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-500/90 text-white font-mono text-[10px] py-2 px-4 rounded-xl shadow-lg border border-red-500 flex items-center gap-2 z-50">
          <AlertCircle className="w-4 h-4" />
          <span>Error: {error}</span>
        </div>
      )}

      {/* Global Modals overlay */}
      <AnimatePresence>
        {showSummary && <InvestigationSummaryPanel onClose={() => setShowSummary(false)} />}
      </AnimatePresence>
    </div>
  )
}
