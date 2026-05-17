import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../../context/AppContextSimplified'
import InvestigationQueue from '../watchtower/InvestigationQueue'
import RadarCanvas from '../radar/RadarCanvas'
import ContainmentActionPanel from '../interrogation/ContainmentActionPanel'
import { Crosshair } from 'lucide-react'

const AnalystWorkspace = () => {
  const { selectedCaseId } = useApp()
  const showRightPanel = selectedCaseId !== null

  return (
    <div className="h-full w-full relative">
      {/* Desktop Layout — 3-Column Triage View */}
      <div className="hidden lg:grid h-full w-full grid-cols-[300px_1fr_340px] gap-0">
        {/* Left — Investigation Queue */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="h-full overflow-hidden border-r border-slate-800/50"
        >
          <InvestigationQueue />
        </motion.div>

        {/* Center — Radar Graph */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="h-full overflow-hidden relative"
        >
          <RadarCanvas />
        </motion.div>

        {/* Right — Containment Action Panel */}
        <AnimatePresence mode="wait">
          {showRightPanel ? (
            <motion.div
              key="containment-panel"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="h-full overflow-hidden border-l border-slate-800/50"
            >
              <ContainmentActionPanel />
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex items-center justify-center border-l border-slate-800/50 bg-slate-950/50"
            >
              <div className="text-center text-slate-600">
                <Crosshair className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-xs font-mono opacity-50">Select a case to review</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden flex flex-col h-full w-full overflow-auto">
        <div className="flex-shrink-0 h-[35vh] min-h-[250px]">
          <InvestigationQueue />
        </div>
        <div className="flex-shrink-0 h-96 relative">
          <RadarCanvas />
        </div>
        <AnimatePresence mode="wait">
          {showRightPanel && (
            <motion.div
              key="containment-drawer"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="flex-shrink-0 min-h-[300px]"
            >
              <ContainmentActionPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AnalystWorkspace
