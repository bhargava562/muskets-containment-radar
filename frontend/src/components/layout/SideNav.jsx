import { motion } from 'framer-motion'
import { Inbox, Shield, FileText, Users, BarChart3 } from 'lucide-react'
import { useState } from 'react'

const SideNav = ({ activeView, onViewChange, role }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Role-specific navigation items
  const getNavItems = () => {
    switch (role) {
      case 'AML Compliance Officer':
        return [
          { id: 'queue', icon: Inbox, label: 'Triage Queue' },
          { id: 'active', icon: Shield, label: 'Active Investigations' },
        ]
      case 'Legal & Principal Officer':
        return [
          { id: 'pending', icon: FileText, label: 'Pending Reviews' },
          { id: 'audit', icon: BarChart3, label: 'Audit Logs' },
          { id: 'export', icon: FileText, label: 'Export Center' },
        ]
      case 'Branch Manager':
        return [
          { id: 'lookup', icon: Users, label: 'Customer Lookup' },
          { id: 'verification', icon: FileText, label: 'Document Verification' },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <motion.nav
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      animate={{ width: isExpanded ? 200 : 64 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-slate-900/80 backdrop-blur-md border-r border-slate-800 z-40 flex flex-col py-6"
    >
      {/* Logo/Brand Area */}
      <div className="px-4 mb-8 flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: isExpanded ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          className="text-sm font-semibold text-slate-200 whitespace-nowrap"
        >
          Muskets
        </motion.span>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col gap-2 px-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id

          return (
            <motion.button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                ${isActive 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }
              `}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
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
    </motion.nav>
  )
}

export default SideNav
