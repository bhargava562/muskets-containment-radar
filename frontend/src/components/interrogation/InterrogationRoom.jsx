import { motion } from 'framer-motion'
import { X, User, AlertTriangle, Building2, ShieldAlert, ShieldCheck, UserCheck } from 'lucide-react'
import { useApp, APP_STATES } from '../../context/AppContext'
import MuleMetrics from './MuleMetrics'
import MerchantMetrics from './MerchantMetrics'
import VictimMetrics from './VictimMetrics'
import AuditLedger from './AuditLedger'

const InterrogationRoom = () => {
  const { selectedNode, appState, closePanel, containedNode, frozenNodes } = useApp()

  // Determine which view to show
  const showAuditLedger = appState === APP_STATES.AUDIT_LOGGED
  const showContainmentConfirm = appState === APP_STATES.CONTAINED

  // Get the node to display (either selected or the one that was just contained)
  const displayNode = selectedNode || containedNode
  const isFrozen = displayNode && frozenNodes.includes(displayNode.id)

  if (!displayNode && !showAuditLedger && !showContainmentConfirm) {
    return null
  }

  const getNodeConfig = () => {
    if (!displayNode) return { icon: User, color: 'slate', label: 'NODE METRICS', badge: null }

    switch (displayNode.type) {
      case 'mule':
        return {
          icon: AlertTriangle,
          color: 'red',
          label: 'SUSPECT ANALYSIS',
          badge: { text: 'ACTIVE MULE', bg: 'bg-red-500/20', border: 'border-red-500/40', textColor: 'text-red-400' }
        }
      case 'merchant':
        return {
          icon: Building2,
          color: 'amber',
          label: 'EXPOSURE ASSESSMENT',
          badge: { text: 'PASSIVE INNOCENT', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', textColor: 'text-emerald-400' }
        }
      case 'victim':
        return {
          icon: UserCheck,
          color: 'blue',
          label: 'VICTIM PROFILE',
          badge: { text: 'PROTECTED ENTITY', bg: 'bg-blue-500/20', border: 'border-blue-500/40', textColor: 'text-blue-400' }
        }
      default:
        return { icon: User, color: 'slate', label: 'NODE METRICS', badge: null }
    }
  }

  const nodeConfig = getNodeConfig()
  const NodeIcon = nodeConfig.icon

  const iconColorClass = {
    red: 'text-red-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    slate: 'text-slate-400'
  }[nodeConfig.color]

  const iconBgClass = {
    red: 'bg-red-500/20',
    amber: 'bg-amber-500/20',
    blue: 'bg-blue-500/20',
    slate: 'bg-slate-500/20'
  }[nodeConfig.color]

  return (
    <div className="h-full glass-panel rounded-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-slate-700/50">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${iconBgClass}`}>
              {showAuditLedger ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : isFrozen ? (
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
              ) : (
                <NodeIcon className={`w-4 h-4 ${iconColorClass}`} />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-slate-100 tracking-wide truncate">
                {showAuditLedger ? 'EVIDENCE LEDGER' : nodeConfig.label}
              </h2>
              {displayNode && (
                <p className="text-[10px] font-mono text-slate-500 truncate">
                  NODE: <span className="text-cyan-400">{displayNode.id}</span>
                </p>
              )}
            </div>
          </div>
          <motion.button
            onClick={closePanel}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* Classification Badge */}
        {displayNode && nodeConfig.badge && !showAuditLedger && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${nodeConfig.badge.bg} border ${nodeConfig.badge.border}`}
          >
            {displayNode.type === 'mule' ? (
              <span className="text-xs">🚨</span>
            ) : displayNode.type === 'merchant' ? (
              <span className="text-xs">🟢</span>
            ) : (
              <span className="text-xs">🔵</span>
            )}
            <span className={`text-[10px] font-bold font-mono ${nodeConfig.badge.textColor}`}>
              {isFrozen ? 'FROZEN - ' : ''}{nodeConfig.badge.text}
            </span>
          </motion.div>
        )}

        {/* Frozen Status */}
        {isFrozen && !showAuditLedger && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30"
          >
            <ShieldAlert className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400">CONTAINMENT ACTIVE</span>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {showAuditLedger ? (
          <AuditLedger />
        ) : showContainmentConfirm ? (
          <div className="space-y-4">
            {displayNode?.type === 'mule' ? (
              <MuleMetrics node={displayNode} isContained={true} />
            ) : displayNode?.type === 'merchant' ? (
              <MerchantMetrics node={displayNode} isContained={true} />
            ) : null}
          </div>
        ) : displayNode?.type === 'mule' ? (
          <MuleMetrics node={displayNode} />
        ) : displayNode?.type === 'merchant' ? (
          <MerchantMetrics node={displayNode} />
        ) : displayNode?.type === 'victim' ? (
          <VictimMetrics node={displayNode} />
        ) : null}
      </div>
    </div>
  )
}

export default InterrogationRoom
