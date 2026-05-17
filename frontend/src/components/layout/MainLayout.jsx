import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import AnalystWorkspace from '../workspaces/AnalystWorkspace'
import ComplianceWorkspace from '../workspaces/ComplianceWorkspace'
import BranchWorkspace from '../workspaces/BranchWorkspace'

const MainLayout = () => {
  const { currentUser, logout } = useAuth()

  // Role-Based Access Control (RBAC) - Route to appropriate workspace
  const renderWorkspace = () => {
    switch (currentUser?.role) {
      case 'AML Compliance Officer':
        return <AnalystWorkspace />
      case 'Legal & Principal Officer':
        return <ComplianceWorkspace />
      case 'Branch Manager':
        return <BranchWorkspace />
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
    <div className="h-screen w-screen overflow-hidden bg-slate-950 font-sans relative">
      {/* Global Header - Role Badge & Logout */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {currentUser?.role && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-1.5 rounded-full text-[10px] font-mono text-slate-200 bg-slate-900/80 border border-slate-800 backdrop-blur-sm"
          >
            {currentUser.role}
          </motion.div>
        )}
        <motion.button
          type="button"
          onClick={logout}
          className="p-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-cyan-400 transition backdrop-blur-sm"
          aria-label="Log out"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogOut className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Role-Based Workspace Rendering */}
      <motion.div
        key={currentUser?.role}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="h-full w-full"
      >
        {renderWorkspace()}
      </motion.div>
    </div>
  )
}

export default MainLayout
