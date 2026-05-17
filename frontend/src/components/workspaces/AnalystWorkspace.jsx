import { motion, AnimatePresence } from 'framer-motion'
import { Target } from 'lucide-react'
import { useApp, APP_STATES } from '../../context/AppContext'
import SoftHoldNotification from '../notifications/SoftHoldNotification'
import InvestigationQueue from '../watchtower/InvestigationQueue'
import RadarCanvas from '../radar/RadarCanvas'
import ContainmentActionPanel from '../interrogation/ContainmentActionPanel'

const AnalystWorkspace = ({ activeView }) => {
  const { selectedNode, appState, containedNode } = useApp()

  // Show right panel when node selected or during active states
  const showRightPanel = selectedNode !== null ||
    appState === APP_STATES.TRACING ||
    appState === APP_STATES.INVESTIGATING ||
    appState === APP_STATES.CONTAINED ||
    appState === APP_STATES.AUDIT_LOGGED

  return (
    <div className="h-full w-full relative">
      {/* Soft Hold Notification */}
      <SoftHoldNotification
        appState={appState}
        containedNode={containedNode}
      />

      {/* Main Content Based on Active View */}
      <AnimatePresence mode="wait">
        {activeView === 'queue' && (
          <motion.div
            key="queue-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full"
          >
            {/* Desktop Layout - Triage Queue View */}
            <div className="hidden lg:grid h-full w-full grid-cols-[30%_1fr_25%] gap-4 p-4">
              {/* Left Panel - Investigation Queue */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="h-full overflow-hidden"
              >
                <InvestigationQueue />
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

              {/* Right Panel - Containment Action */}
              <AnimatePresence mode="wait">
                {showRightPanel ? (
                  <motion.div
                    key="containment-panel"
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="h-full overflow-hidden"
                  >
                    <ContainmentActionPanel />
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
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
              </AnimatePresence>
            </div>

            {/* Mobile/Tablet Layout */}
            <div className="lg:hidden flex flex-col h-full w-full p-3 gap-3 overflow-auto">
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
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="flex-shrink-0 min-h-[300px]"
                  >
                    <ContainmentActionPanel />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {activeView === 'active' && (
          <motion.div
            key="active-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full flex items-center justify-center"
          >
            <div className="text-center text-slate-500">
              <Target className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-bold mb-2">Active Investigations</h3>
              <p className="text-sm">View coming soon</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AnalystWorkspace
