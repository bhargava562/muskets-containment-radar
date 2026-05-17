import { motion, AnimatePresence } from 'framer-motion'
import { Clock, TrendingDown, Shield, Zap, Target } from 'lucide-react'
import { useApp, APP_STATES } from '../../context/AppContext'
import SoftHoldNotification from '../notifications/SoftHoldNotification'
import Watchtower from '../watchtower/Watchtower'
import RadarCanvas from '../radar/RadarCanvas'
import InterrogationRoom from '../interrogation/InterrogationRoom'

const AnalystWorkspace = () => {
  const { selectedNode, appState, containedNode, caseMetadata } = useApp()

  // Show right panel when node selected, during tracing, contained, or audit states
  const showRightPanel = selectedNode !== null ||
    appState === APP_STATES.TRACING ||
    appState === APP_STATES.CONTAINED ||
    appState === APP_STATES.AUDIT_LOGGED

  return (
    <div className="h-full w-full relative">
      {/* Soft Hold Notification */}
      <SoftHoldNotification
        appState={appState}
        containedNode={containedNode}
        caseMetadata={caseMetadata}
      />

      {/* Operational Outcome Metrics Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-4 z-40 glass-panel-dark rounded-xl px-4 py-3 border border-slate-800/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-300 tracking-wide">OPERATIONAL OUTCOMES</span>
        </div>
        <div className="flex items-center gap-6">
          {/* Avg Response Time */}
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-mono">Avg Response:</span>
              <span className="text-xs text-slate-400 line-through font-mono">47 min</span>
              <TrendingDown className="w-3 h-3 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400 font-mono">4 min</span>
            </div>
          </div>

          {/* Innocent Accounts Protected */}
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-mono">Wrongful Freezes:</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">-83%</span>
            </div>
          </div>

          {/* Active Cases */}
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-mono">Active Cases:</span>
              <span className="text-sm font-bold text-cyan-400 font-mono">
                {appState === APP_STATES.MONITORING ? '0' : '1'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Desktop Layout - High-Speed Decision Workspace */}
      <div className="hidden lg:grid h-full w-full grid-cols-[30%_1fr_25%] gap-4 p-4">
        {/* Left Panel - Priority Triage Queue */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="h-full overflow-hidden"
        >
          <Watchtower />
        </motion.div>

        {/* Center Panel - Radar Graph */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="h-full overflow-hidden relative"
        >
          <RadarCanvas />
        </motion.div>

        {/* Right Panel - Containment Review */}
        <AnimatePresence mode="wait">
          {showRightPanel && (
            <motion.div
              key="containment-panel"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full overflow-hidden"
              layoutId="interrogation-room"
            >
              <InterrogationRoom />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Placeholder when right panel is hidden */}
        {!showRightPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex items-center justify-center"
          >
            <div className="text-center text-slate-600">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-mono">Select a node to review</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden flex flex-col h-full w-full p-3 gap-3 overflow-auto">
        {/* Top - Watchtower */}
        <div className="flex-shrink-0 h-[35vh] min-h-[250px]">
          <Watchtower />
        </div>

        {/* Middle - Radar Canvas */}
        <div className="flex-shrink-0 h-96 relative">
          <RadarCanvas />
        </div>

        {/* Bottom Drawer - Interrogation Room */}
        <AnimatePresence mode="wait">
          {showRightPanel && (
            <motion.div
              key="interrogation-drawer"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="flex-shrink-0 min-h-[300px]"
            >
              <InterrogationRoom />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AnalystWorkspace
