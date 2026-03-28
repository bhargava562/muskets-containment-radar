import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Activity, ShieldCheck, Target, TrendingUp } from 'lucide-react'
import { useApp, APP_STATES } from '../../context/AppContext'
import AlertCard from './AlertCard'
import CriticalAlert from './CriticalAlert'

const Watchtower = () => {
  const { transactions, threatAlert, appState, caseMetadata } = useApp()

  const getStatusIndicator = () => {
    switch (appState) {
      case APP_STATES.MONITORING:
        return { color: 'bg-emerald-500', text: 'LIVE MONITORING', pulse: true, icon: Radio }
      case APP_STATES.THREAT_DETECTED:
        return { color: 'bg-red-500', text: 'THREAT DETECTED', pulse: true, icon: Target }
      case APP_STATES.TRACING:
        return { color: 'bg-amber-500', text: 'TRACING LINEAGE', pulse: true, icon: TrendingUp }
      case APP_STATES.INVESTIGATING:
        return { color: 'bg-amber-500', text: 'INVESTIGATING', pulse: true, icon: Target }
      case APP_STATES.CONTAINED:
        return { color: 'bg-cyan-500', text: 'CONTAINED', pulse: false, icon: ShieldCheck }
      case APP_STATES.AUDIT_LOGGED:
        return { color: 'bg-emerald-500', text: 'AUDIT LOGGED', pulse: false, icon: ShieldCheck }
      default:
        return { color: 'bg-slate-500', text: 'OFFLINE', pulse: false, icon: Radio }
    }
  }

  const status = getStatusIndicator()
  const StatusIcon = status.icon

  return (
    <div className="h-full glass-panel rounded-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800/80">
              <Radio className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 tracking-wide">WATCHTOWER</h2>
              <p className="text-xs text-slate-500 font-mono">Transaction Intelligence Feed</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${status.color} ${status.pulse ? 'animate-pulse' : ''}`} />
            <StatusIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-mono font-semibold text-slate-300">{status.text}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <Activity className="w-3 h-3 text-emerald-500" />
            <span>12ms</span>
          </div>
        </div>

        {/* Case ID when active */}
        {appState !== APP_STATES.MONITORING && caseMetadata && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-3 border-t border-slate-700/50"
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">CASE ID:</span>
              <span className="text-cyan-400">{caseMetadata.case_id}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Transaction Feed */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        <AnimatePresence mode="popLayout">
          {/* Critical Alert - Shown when threat detected */}
          {threatAlert && (
            <motion.div
              key="critical-alert"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              layout
              className="mb-4"
            >
              <CriticalAlert alert={threatAlert} />
            </motion.div>
          )}

          {/* Section Header */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-xs font-mono text-slate-500">RECENT TRANSACTIONS</span>
            <div className="flex-1 h-px bg-slate-700/50" />
          </div>

          {/* Normal Transactions */}
          <div className="flex flex-col space-y-3 w-full">
            {transactions.map((txn, index) => (
              <motion.div
                key={`${txn.id}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <AlertCard transaction={txn} />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>

      {/* Footer Status */}
      <div className="flex-shrink-0 p-4 border-t border-slate-700/50 bg-slate-900/30">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${appState === APP_STATES.MONITORING ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-slate-400 font-mono">
              {appState === APP_STATES.MONITORING ? 'Scanning for anomalies...' : 'Active investigation session'}
            </span>
          </div>
          <span className="text-slate-600 font-mono">{transactions.length} TXNs</span>
        </div>
      </div>
    </div>
  )
}

export default Watchtower