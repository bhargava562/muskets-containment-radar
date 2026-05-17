import { motion, AnimatePresence } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { useApp, APP_STATES } from '../../context/AppContext'
import { useAuth } from '../auth/AuthContext'
import SoftHoldNotification from '../notifications/SoftHoldNotification'
import Watchtower from '../watchtower/Watchtower'
import RadarCanvas from '../radar/RadarCanvas'
import InterrogationRoom from '../interrogation/InterrogationRoom'

const MainLayout = () => {
  const { selectedNode, appState, containedNode, caseMetadata } = useApp()
  const { currentUser, logout } = useAuth()

  // Show right panel when node selected, during tracing, contained, or audit states
  const showRightPanel = selectedNode !== null ||
    appState === APP_STATES.TRACING ||
    appState === APP_STATES.CONTAINED ||
    appState === APP_STATES.AUDIT_LOGGED

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 font-sans relative">
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
        {currentUser?.role && (
          <span className="px-2 py-1 rounded-full text-[10px] font-mono text-slate-200 bg-slate-900/80 border border-slate-800">
            {currentUser.role}
          </span>
        )}
        <button
          type="button"
          onClick={logout}
          className="p-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-cyan-400 transition"
          aria-label="Log out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <SoftHoldNotification
        appState={appState}
        containedNode={containedNode}
        caseMetadata={caseMetadata}
      />
      {/* Desktop Layout */}
      <div className="hidden lg:grid h-full w-full grid-cols-[30%_1fr_25%] gap-4 p-4">
        {/* Left Panel - Watchtower */}
        <div className="h-full overflow-hidden">
          <Watchtower />
        </div>

        {/* Center Panel - Radar Canvas */}
        <div className="h-full overflow-hidden relative">
          <RadarCanvas />
        </div>

        {/* Right Panel - Interrogation Room */}
        <AnimatePresence mode="wait">
          {showRightPanel && (
            <motion.div
              key="interrogation-panel"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full overflow-hidden"
            >
              <InterrogationRoom />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Placeholder when right panel is hidden */}
        {!showRightPanel && (
          <div className="h-full" />
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

export default MainLayout