import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../../context/AppContextSimplified'
import { useInvestigation } from '../../context/InvestigationContext'
import InvestigationWorkspace from '../investigation/InvestigationWorkspace'
import InvestigationQueue from '../watchtower/InvestigationQueue'
import GlobalAuditLogs from '../watchtower/GlobalAuditLogs'

const AnalystWorkspace = ({ activeView }) => {
  const { selectedCaseId, setSelectedCaseId } = useApp()
  const { activeCaseId, startInvestigation, exitWorkspace } = useInvestigation()

  // Sync selection from the watchtower queue into the active investigation context
  useEffect(() => {
    if (selectedCaseId && activeView === 'queue') {
      startInvestigation(selectedCaseId)
    }
  }, [selectedCaseId, startInvestigation, activeView])

  // Sync cancellation back to main context
  useEffect(() => {
    if (!activeCaseId && selectedCaseId) {
      setSelectedCaseId(null)
    }
  }, [activeCaseId, selectedCaseId, setSelectedCaseId])

  // Reset workspace state if navigating to other global sidebar items
  useEffect(() => {
    if (activeView !== 'queue' && activeCaseId) {
      exitWorkspace()
    }
  }, [activeView, activeCaseId, exitWorkspace])

  if (activeCaseId) {
    return <InvestigationWorkspace />
  }

  if (activeView === 'logs') {
    return <GlobalAuditLogs />
  }

  return (
    <div className="h-full w-full relative bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        <div className="mb-4">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">AUDIT QUEUE</span>
          <h2 className="text-xl font-bold text-slate-200 tracking-wide">Triage Operations Queue</h2>
        </div>
        <div className="flex-1 min-h-[500px] border border-slate-900 rounded-2xl overflow-hidden">
          <InvestigationQueue />
        </div>
      </div>
    </div>
  )
}

export default AnalystWorkspace
