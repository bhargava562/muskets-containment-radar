import { useState, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Zap, ArrowRight, ChevronDown, ChevronUp, Crosshair, Clock, Shield, CheckCircle2 } from 'lucide-react'
import { useApp, APP_STATES } from '../../context/AppContext'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const CriticalAlert = ({ alert }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const { appState, initializeTrace } = useApp()

  const canInitializeTrace = appState === APP_STATES.THREAT_DETECTED
  const isCaseClosed = appState === APP_STATES.AUDIT_LOGGED

  return (
    <motion.div
      layout
      className={`w-full flex-shrink-0 rounded-2xl overflow-hidden ${!isCaseClosed ? 'animate-pulse-glow' : ''}`}
    >
      {/* Case Closed Banner */}
      {isCaseClosed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-3 bg-gradient-to-r from-emerald-950/70 to-emerald-900/50 border border-emerald-500/40 rounded-t-2xl"
        >
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="text-sm font-bold text-emerald-400 tracking-wide">CASE CLOSED - ANOMALY RESOLVED</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
        </motion.div>
      )}

      {/* Alert Header - Always Visible */}
      <div
        className={`glass-panel p-5 cursor-pointer ${
          isCaseClosed
            ? 'bg-gradient-to-r from-emerald-950/30 to-slate-900/50 border border-emerald-500/20'
            : 'bg-gradient-to-r from-red-950/70 to-red-900/50 border border-red-500/40'
        } ${!isCaseClosed ? 'rounded-t-2xl' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isCaseClosed ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              {isCaseClosed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
              )}
            </div>
            <div>
              <span className={`text-sm font-bold tracking-wide ${isCaseClosed ? 'text-emerald-400' : 'text-red-400'}`}>
                {isCaseClosed ? 'RESOLVED ANOMALY' : 'CRITICAL ANOMALY'}
              </span>
              <p className={`text-xs font-mono mt-0.5 ${isCaseClosed ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                {alert.alertType?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-500">{isCaseClosed ? 'FINAL SCORE' : 'RISK SCORE'}</span>
              <p className={`text-xl font-bold ${isCaseClosed ? 'text-emerald-400' : 'text-red-400'}`}>
                {alert.riskScore}%
              </p>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>

        {/* Amount Display */}
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${
          isCaseClosed
            ? 'bg-emerald-950/30 border-emerald-500/20'
            : 'bg-red-950/50 border-red-500/20'
        }`}>
          {isCaseClosed ? (
            <Shield className="w-5 h-5 text-emerald-400" />
          ) : (
            <Zap className="w-5 h-5 text-amber-400" />
          )}
          <div>
            <p className={`text-2xl font-bold ${isCaseClosed ? 'text-emerald-400' : 'text-gradient-danger'}`}>
              {formatCurrency(alert.totalAmount)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {isCaseClosed ? 'Recovered and audited' : `Fragmented across ${alert.fragmentationCount} accounts`}
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`glass-panel-dark p-5 rounded-b-2xl border border-t-0 space-y-4 ${
              isCaseClosed ? 'border-emerald-500/20' : 'border-red-500/20'
            }`}>
              {/* Alert Description - Highlighted */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 to-amber-950/20 border border-red-500/20">
                <p className="text-sm text-slate-200 leading-relaxed">
                  {alert.description || (
                    <>
                      <span className="text-red-400 font-semibold">ANOMALY DETECTED.</span>{' '}
                      <span className="text-amber-400 font-bold">{formatCurrency(alert.totalAmount)}</span>{' '}
                      fragmented into{' '}
                      <span className="text-red-400 font-semibold">{alert.fragmentationCount} accounts</span>{' '}
                      within{' '}
                      <span className="text-amber-400 font-semibold">{alert.timeWindowSeconds}s</span>.
                    </>
                  )}
                </p>
              </div>

              {/* Time Window Indicator */}
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">Time Window:</span>
                <span className="font-mono text-amber-400 font-semibold">{alert.timeWindowSeconds}s</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Source:</span>
                <span className="font-mono text-blue-400">{alert.sourceAccount}</span>
              </div>

              {/* Trigger Rules */}
              {alert.triggerRules && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-500 font-mono">TRIGGERED RULES:</span>
                  <div className="flex flex-wrap gap-2">
                    {alert.triggerRules.map((rule, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-md bg-red-500/15 text-red-400 text-xs font-mono border border-red-500/20"
                      >
                        {rule.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Outbound Transactions */}
              {alert.outboundTransactions && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-500 font-mono">OUTBOUND SPLITS:</span>
                  <div className="space-y-2">
                    {alert.outboundTransactions.map((txn, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40">
                        <ArrowRight className="w-4 h-4 text-red-400" />
                        <span className="font-mono text-xs text-slate-400">{txn.beneficiary}</span>
                        <span className="ml-auto font-mono text-sm font-semibold text-red-400">
                          {formatCurrency(txn.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {canInitializeTrace && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    initializeTrace()
                  }}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600
                           text-white font-bold text-base flex items-center justify-center gap-3
                           hover:from-amber-500 hover:to-orange-500 transition-all
                           shadow-lg shadow-orange-500/30 border border-amber-500/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Crosshair className="w-5 h-5" />
                  INITIALIZE LINEAGE TRACE
                </motion.button>
              )}

              {appState !== APP_STATES.THREAT_DETECTED && appState !== APP_STATES.MONITORING && (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-mono text-cyan-400 font-semibold">
                    TRACE ACTIVE - INVESTIGATION IN PROGRESS
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default CriticalAlert