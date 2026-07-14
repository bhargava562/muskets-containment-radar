import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import SideNav from './SideNav'
import AnalystWorkspace from '../workspaces/AnalystWorkspace'
import ComplianceWorkspace from '../workspaces/ComplianceWorkspace'
import BranchWorkspace from '../workspaces/BranchWorkspace'

const MainLayout = () => {
  const { currentUser } = useAuth()
  const [activeView, setActiveView] = useState(() => {
    switch (currentUser?.role) {
      case 'AML Compliance Officer':
        return 'queue'
      case 'Principal Officer (Compliance)':
        return 'pending'
      case 'Branch Manager':
        return 'assigned'
      default:
        return 'queue'
    }
  })

  const renderWorkspace = () => {
    switch (currentUser?.role) {
      case 'AML Compliance Officer':
        return <AnalystWorkspace activeView={activeView} />
      case 'Principal Officer (Compliance)':
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
    <div className="h-screen w-screen overflow-hidden bg-slate-950 font-sans flex">
      {/* Hoverable SideNav */}
      <SideNav
        activeView={activeView}
        onViewChange={setActiveView}
        role={currentUser?.role}
      />

      {/* Workspace Content — Offset for SideNav */}
      <main className="flex-1 ml-16 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentUser?.role}-${activeView}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            {renderWorkspace()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default MainLayout
