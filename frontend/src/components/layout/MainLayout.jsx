import { motion, AnimatePresence } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import SideNav from './SideNav'
import AnalystWorkspace from '../workspaces/AnalystWorkspace'
import ComplianceWorkspace from '../workspaces/ComplianceWorkspace'
import BranchWorkspace from '../workspaces/BranchWorkspace'

const MainLayout = () => {
  const { currentUser, logout } = useAuth()
  const [activeView, setActiveView] = useState(() => {
    // Default view based on role
    switch (currentUser?.role) {
      case 'AML Compliance Officer':
        return 'queue'
      case 'Legal & Principal Officer':
        return 'pending'
      case 'Branch Manager':
        return 'lookup'
      default:
        return 'queue'
    }
  })

  // Role-Based Access Control (RBAC) - Route to appropriate workspace
  const renderWorkspace = () => {
    switch (currentUser?.role) {
      case 'AML Compliance Officer':
        return <AnalystWorkspace activeView={activeView} />
      case 'Legal & Principal Officer':
        return <ComplianceWorkspace activeView={activeView} />
      case 'Branch Manager':
        return <BranchWorkspace activeView={activeView} />
      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 text-sm">Unknown role: {currentUser?.role}</p>
              <p className="text-slate-500 text-xs mt-2">Please contact system administrator</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 font-sans flex flex-col">
      {/* Fixed Header - No Overlap */}
      <header className="flex-shrink-0 flex items-center justify-end gap-4 px-6 py-4 bg-slate-950/50 backdrop-blur-sm border-b border-slate-800/50 z-30">
        {currentUser?.role && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-1.5 rounded-full text-[10px] font-mono text-slate-200 bg-slate-900/80 border border-slate-800"
          >
            {currentUser.role}
          </motion.div>
        )}
        <motion.button
          type="button"
          onClick={logout}
          className="p-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-cyan-400 transition"
          aria-label="Log out"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogOut className="w-4 h-4" />
        </motion.button>
      </header>

      {/* Main Content Area with SideNav */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Hoverable SideNav */}
        <SideNav 
          activeView={activeView} 
          onViewChange={setActiveView}
          role={currentUser?.role}
        />

        {/* Workspace Content - Offset for SideNav */}
        <main className="flex-1 ml-16 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentUser?.role}-${activeView}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              {renderWorkspace()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
