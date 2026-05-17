import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Activity, ShieldCheck, Target, AlertTriangle, Clock, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { useApp, APP_STATES } from '../../context/AppContext'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const InvestigationQueue = () => {
  const { transactions, threatAlert, appState, caseMetadata, initializeTrace } = useApp()
  const [countdown, setCountdown] = useState(900) // 15 minutes
  const [expandedAlert, setExpandedAlert] = useState(null)

  // Countdown timer
  useEffect(() => {
    if (appState === APP_STATES.THREAT_DETECTED && countdown > 0) {
      const timer = setInterval(() => setCountdown(prev => Math.max(0, prev - 1)), 1000)
      return () => clearInterval(timer)
    }
  }, [appState, countdown])

  useEffect(() => {
    if (appState === APP_STATES.THREAT_DETECTED) setCountdown(900)
  }, [appState, threatAlert])

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusIndicator = () => {
    switch (appState) {
      case APP_STATES.MONITORING:
        return { color: 'bg-emerald-500', text: 'LIVE', pulse: true, icon: Radio }
      case APP_STATES.THREAT_DETECTED:
        return { color: 'bg-red-500', text: 'ALERT', pulse: true, icon: AlertTriangle }
      case APP_STATES.TRACING:
      case APP_STATES.INVESTIGATING:
        return { color: 'bg-amber-500', text: 'ACTIVE', pulse: true, icon: Target }
      case APP_STATES.CONTAINED:
      case APP_STATES.AUDIT_LOGGED:
        return { color: 'bg-cyan-500', text: 'RESOLVED', pulse: false, icon: ShieldCheck }
      default:
        return { color: 'bg-slate-500', text: 'OFFLINE', pulse: false, icon: Radio }
    }
  }

  const status = getStatusIndicator()
  const StatusIcon = status.icon

  // Generate AI Summary
  const generateAISummary = (alert) => {
    if (!alert) return []
    const dispersedAmount = formatCurrency(alert.total_amount || 0)
    const accountCount = alert.fragmentation_count || 0
    const timeWindow = alert.time_window_seconds || 0
    const recoverable = Math.round((alert.total_amount || 0) * 0.675)
    
    return [
      `${dispersedAmount} dispersed to ${accountCount} accounts in ${timeWindow}s`,
      `Device linked to ${accountCount - 1} prior flagged mules`,
      `Est. recoverable: ${formatCurrency(recoverable)}`
    ]
  }

  const aiSummary = generateAISummary(threatAlert)

  // Priority grouping
  const p1Alerts = threatAlert ? [threatAlert] : []
  const p2Alerts = transactions.filter(t => t.amount > 50000 && t.amount < 100000)
  const p3Alerts = transactions.filter(t => t.amount <= 50000)

  return (
    <div className="h-full glass-panel rounded-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-5 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800/80">
              <Radio className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Triage Queue</h2>
              <p className="text-xs text-slate-500 font-mono">Priority-Based Review</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${status.color} ${status.pulse ? 'animate-pulse' : ''}`} />
            <StatusIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-mono text-slate-300">{status.text}</span>
          </div>
        </div>

        {caseMetadata && appState !== APP_STATES.MONITORING && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs font-mono"
          >
            <span className="text-slate-500">CASE ID:</span>
            <span className="text-cyan-400">{caseMetadata.case_id}</span>
          </motion.div>
        )}
      </div>

      {/* Queue Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {/* P1 CRITICAL */}
          {p1Alerts.length > 0 && (
            <motion.div
              key="p1-section"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              layout
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-red-400 font-bold">P1 CRITICAL</span>
                <div className="h-px flex-1 bg-gradient-to-r from-red-500/50 to-transparent" />
              </div>

              {p1Alerts.map((alert) => (
                <motion.div
                  key={alert.id || 'p1-alert'}
                  layout
                  className="relative"
                >
                  {appState === APP_STATES.THREAT_DETECTED && (
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 via-amber-500/20 to-red-500/20 rounded-xl blur animate-pulse" />
                  )}
                  
                  <div className="relative glass-panel-dark rounded-xl border border-red-500/30 overflow-hidden">
                    {/* Minimalist Card */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-red-400 font-bold">HIGH VELOCITY FRAUD</span>
                          </div>
                          <div className="text-2xl font-bold text-slate-100">
                            {formatCurrency(alert.total_amount || alert.amount)}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-1">
                            Amount at Risk
                          </div>
                        </div>

                        {appState === APP_STATES.THREAT_DETECTED && (
                          <motion.div
                            animate={{ 
                              opacity: countdown < 300 ? [1, 0.5, 1] : 1,
                              scale: countdown < 300 ? [1, 1.05, 1] : 1
                            }}
                            transition={{ duration: 1, repeat: countdown < 300 ? Infinity : 0 }}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
                              countdown < 300 
                                ? 'bg-red-500/20 border border-red-500/40' 
                                : 'bg-amber-500/20 border border-amber-500/40'
                            }`}
                          >
                            <Clock className={`w-3 h-3 ${countdown < 300 ? 'text-red-400' : 'text-amber-400'}`} />
                            <span className={`text-xs font-mono font-bold ${countdown < 300 ? 'text-red-400' : 'text-amber-400'}`}>
                              {formatCountdown(countdown)}
                            </span>
                          </motion.div>
                        )}
                      </div>

                      {/* Expandable Details Toggle */}
                      <button
                        type="button"
                        onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                        className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition"
                      >
                        {expandedAlert === alert.id ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Hide Details</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Show AI Summary</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Expandable AI Summary */}
                    <AnimatePresence>
                      {expandedAlert === alert.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-slate-700/50 bg-slate-900/50"
                        >
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Zap className="w-4 h-4 text-cyan-400" />
                              <span className="text-xs font-bold text-cyan-400 font-mono">AI EXPLAINABLE SUMMARY</span>
                            </div>
                            <div className="space-y-2">
                              {aiSummary.map((summary, idx) => (
                                <div key={`summary-${idx}`} className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                                  <span className="text-xs text-slate-300 leading-relaxed">{summary}</span>
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                              <span className="text-[10px] text-slate-500 font-mono">TIME SAVED</span>
                              <span className="text-sm font-bold text-cyan-400">~3.5 hours</span>
                            </div>

                            {appState === APP_STATES.THREAT_DETECTED && (
                              <motion.button
                                type="button"
                                onClick={initializeTrace}
                                className="w-full mt-3 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                Initialize Trace
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* P2 MEDIUM */}
          {p2Alerts.length > 0 && (
            <motion.div key="p2-section" layout>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-amber-400">P2 MEDIUM</span>
                <div className="h-px flex-1 bg-slate-700/50" />
              </div>
              <div className="space-y-2">
                {p2Alerts.slice(0, 3).map((txn) => (
                  <div key={txn.id} className="glass-panel-dark rounded-lg p-3 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-200">{formatCurrency(txn.amount)}</div>
                      <div className="text-xs text-slate-500 font-mono">{txn.account_id}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* P3 MONITOR */}
          {p3Alerts.length > 0 && (
            <motion.div key="p3-section" layout>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-slate-500">P3 MONITOR</span>
                <div className="h-px flex-1 bg-slate-700/50" />
              </div>
              <div className="text-xs text-slate-600 font-mono text-center py-2">
                {p3Alerts.length} low-priority alerts
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-slate-700/50 bg-slate-900/30">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-emerald-500" />
            <span className="text-slate-400 font-mono">12ms latency</span>
          </div>
          <span className="text-slate-600 font-mono">{transactions.length} queued</span>
        </div>
      </div>
    </div>
  )
}

export default InvestigationQueue
