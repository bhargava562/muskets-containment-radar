import { motion } from 'framer-motion'
import { Inbox, Shield, FileText, Users, BarChart3, LogOut, Scale, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useApp, CASE_STATUS } from '../../context/AppContextSimplified'
import { useAuth } from '../auth/AuthContext'

const SideNav = ({ activeView, onViewChange, role }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { getCasesByStatus, resetDatabase } = useApp()
  const { logout } = useAuth()

  // Live case counts for badges
  const pendingCount = getCasesByStatus(CASE_STATUS.PENDING_TRIAGE).length
  const reviewCount = getCasesByStatus(CASE_STATUS.AWAITING_LEGAL_REVIEW).length
  const activeCount = getCasesByStatus(CASE_STATUS.RESTRICTION_ACTIVE).length

  // Role-specific navigation items
  const getNavItems = () => {
    switch (role) {
      case 'AML Compliance Officer':
        return [
          { id: 'queue', icon: Inbox, label: 'Triage Queue', count: pendingCount, urgent: pendingCount > 0 },
        ]
      case 'Legal & Principal Officer':
        return [
          { id: 'pending', icon: Scale, label: 'Pending Reviews', count: reviewCount, urgent: reviewCount > 0 },
          { id: 'export', icon: FileText, label: 'Export Center' },
        ]
      case 'Branch Manager':
        return [
          { id: 'assigned', icon: Users, label: 'Assigned Cases', count: activeCount },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  // Role display label
  const getRoleShort = () => {
    switch (role) {
      case 'AML Compliance Officer': return 'AML Officer'
      case 'Legal & Principal Officer': return 'Legal Officer'
      case 'Branch Manager': return 'Branch Mgr'
      default: return role
    }
  }

  return (
    <motion.nav
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      animate={{ width: isExpanded ? 220 : 64 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-slate-900/90 backdrop-blur-xl border-r border-slate-700/50 z-40 flex flex-col py-5"
    >
      {/* Logo */}
      <div className="px-4 mb-8 flex items-center gap-3 overflow-hidden">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isExpanded ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden whitespace-nowrap"
        >
          <span className="text-sm font-bold text-white tracking-wide">MUSKETS</span>
          <p className="text-[10px] text-slate-400 font-mono">IOB Containment</p>
        </motion.div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col gap-1.5 px-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id

          return (
            <motion.button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`
                relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                ${isActive
                  ? 'bg-cyan-500/15 text-cyan-400 shadow-inner shadow-cyan-500/5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }
              `}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="relative flex-shrink-0">
                <Icon className="w-5 h-5" />
                {item.count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center
                      ${item.urgent ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-600 text-slate-200'}
                    `}
                  >
                    {item.count}
                  </motion.span>
                )}
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: isExpanded ? 1 : 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            </motion.button>
          )
        })}
      </div>

      {/* Bottom Section — Role + Logout */}
      <div className="px-3 space-y-2 border-t border-slate-700/50 pt-4 mt-2">
        {/* Role Badge */}
        <div className="flex items-center gap-3 px-3 py-2 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-cyan-400">
            {role?.charAt(0)}
          </div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-slate-400 font-medium whitespace-nowrap overflow-hidden"
          >
            {getRoleShort()}
          </motion.span>
        </div>

        {/* Demo Reset */}
        <motion.button
          onClick={() => { resetDatabase(); logout(); }}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:text-amber-400 hover:bg-amber-500/10 transition-all w-full"
          whileTap={{ scale: 0.97 }}
        >
          <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            className="text-[10px] font-medium whitespace-nowrap"
          >
            Reset Demo
          </motion.span>
        </motion.button>

        {/* Logout */}
        <motion.button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          whileTap={{ scale: 0.97 }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs font-medium whitespace-nowrap"
          >
            Sign Out
          </motion.span>
        </motion.button>
      </div>
    </motion.nav>
  )
}

export default SideNav
