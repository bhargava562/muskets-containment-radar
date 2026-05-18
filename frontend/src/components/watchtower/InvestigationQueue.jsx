import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, AlertCircle, AlertOctagon, Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { useApp, CASE_STATUS } from '../../context/AppContextSimplified'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const getPriorityConfig = (priority) => {
  switch (priority) {
    case 'P1': return {
      icon: AlertOctagon,
      border: 'border-red-500/40',
      bg: 'bg-red-500/5',
      badge: 'bg-red-500/20 text-red-400',
      label: 'CRITICAL',
      labelColor: 'text-red-400'
    }
    case 'P2': return {
      icon: AlertTriangle,
      border: 'border-amber-500/40',
      bg: 'bg-amber-500/5',
      badge: 'bg-amber-500/20 text-amber-400',
      label: 'HIGH',
      labelColor: 'text-amber-400'
    }
    case 'P3': return {
      icon: AlertCircle,
      border: 'border-blue-500/40',
      bg: 'bg-blue-500/5',
      badge: 'bg-blue-500/20 text-blue-400',
      label: 'MEDIUM',
      labelColor: 'text-blue-400'
    }
    default: return {
      icon: AlertCircle,
      border: 'border-slate-600',
      bg: 'bg-slate-800',
      badge: 'bg-slate-600 text-slate-300',
      label: 'UNKNOWN',
      labelColor: 'text-slate-400'
    }
  }
}

const getStatusBadge = (status) => {
  switch (status) {
    case CASE_STATUS.AWAITING_LEGAL_REVIEW:
      return { text: 'IN LEGAL', color: 'bg-cyan-500/15 text-cyan-400' }
    case CASE_STATUS.CLOSED_FALSE_POSITIVE:
      return { text: 'FALSE POSITIVE', color: 'bg-slate-700/50 text-slate-400' }
    case CASE_STATUS.RETURNED_TO_AML:
      return { text: 'RETURNED', color: 'bg-amber-500/15 text-amber-400' }
    default:
      return { text: status, color: 'bg-slate-700 text-slate-400' }
  }
}

// Countdown timer component
const CountdownTimer = ({ timestamp, priority }) => {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(timestamp).getTime()
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setElapsed(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [timestamp])

  return (
    <span className={`font-mono text-[11px] tabular-nums flex items-center gap-1 ${
      priority === 'P1' ? 'text-red-400' : 'text-slate-500'
    }`}>
      <Clock className="w-3 h-3" />
      <span className={priority === 'P1' ? 'animate-pulse' : ''}>{elapsed}</span>
    </span>
  )
}

const InvestigationQueue = () => {
  const { getCasesByStatus, getCasesByStatuses, setSelectedCaseId, selectedCaseId } = useApp()
  const [activeTab, setActiveTab] = useState('active')

  // Active Queue: PENDING_TRIAGE + RETURNED_TO_AML
  const activeCases = getCasesByStatuses([CASE_STATUS.PENDING_TRIAGE, CASE_STATUS.RETURNED_TO_AML])
  // Processed: AWAITING_LEGAL_REVIEW + CLOSED_FALSE_POSITIVE
  const processedCases = getCasesByStatuses([CASE_STATUS.AWAITING_LEGAL_REVIEW, CASE_STATUS.CLOSED_FALSE_POSITIVE])

  const displayCases = activeTab === 'active' ? activeCases : processedCases

  // Group active by priority
  const p1Cases = displayCases.filter(c => c.priority === 'P1')
  const p2Cases = displayCases.filter(c => c.priority === 'P2')
  const p3Cases = displayCases.filter(c => c.priority === 'P3')

  const CaseCard = ({ caseData }) => {
    const config = getPriorityConfig(caseData.priority)
    const Icon = config.icon
    const isSelected = selectedCaseId === caseData.id
    const isReturned = caseData.status === CASE_STATUS.RETURNED_TO_AML
    const isProcessed = activeTab === 'processed'
    const statusBadge = isProcessed ? getStatusBadge(caseData.status) : null

    return (
      <motion.button
        layout
        onClick={() => setSelectedCaseId(caseData.id)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -200, transition: { duration: 0.4, ease: 'easeInOut' } }}
        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${
          isReturned ? 'border-amber-500/30 bg-amber-500/5' :
          isProcessed ? 'border-slate-700/30 bg-slate-900/30' :
          `${config.border} ${config.bg}`
        } ${
          isSelected
            ? 'ring-1 ring-cyan-500/50 bg-cyan-500/5 border-cyan-500/30'
            : 'hover:bg-slate-800/40'
        }`}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-start gap-2.5">
          {isReturned ? (
            <RotateCcw className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
          ) : (
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.labelColor}`} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${config.badge}`}>
                  {caseData.priority}
                </span>
                {isReturned && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                    RETURNED
                  </span>
                )}
                {statusBadge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statusBadge.color}`}>
                    {statusBadge.text}
                  </span>
                )}
              </div>
              {!isProcessed && (
                <CountdownTimer timestamp={caseData.timestamp} priority={caseData.priority} />
              )}
            </div>
            <p className="text-sm font-semibold text-slate-200 mb-1 truncate">
              {caseData.customerName}
            </p>
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {caseData.aiSummary}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="text-slate-500">Risk</span>
              <span className="font-mono font-semibold text-slate-300">{formatCurrency(caseData.riskAmount)}</span>
            </div>
          </div>
        </div>
      </motion.button>
    )
  }

  const PriorityGroup = ({ label, cases, colorClass }) => {
    if (cases.length === 0) return null
    return (
      <div className="space-y-2">
        <div className={`text-[10px] font-bold tracking-widest uppercase ${colorClass} px-1`}>
          {label}
        </div>
        <AnimatePresence mode="popLayout">
          {cases.map(caseData => (
            <CaseCard key={caseData.id} caseData={caseData} />
          ))}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-950">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-200 tracking-wide">INVESTIGATION</h2>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
            activeCases.length > 0 ? 'bg-red-500/15 text-red-400' : 'bg-slate-800 text-slate-500'
          }`}>
            {activeCases.length} active
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-0.5 rounded-lg bg-slate-900/50 border border-slate-800/30">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
              activeTab === 'active'
                ? 'bg-slate-800 text-slate-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            Active Queue
            {activeCases.length > 0 && (
              <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-red-500/20 text-red-400">
                {activeCases.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('processed')}
            className={`flex-1 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
              activeTab === 'processed'
                ? 'bg-slate-800 text-slate-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            Processed
            {processedCases.length > 0 && (
              <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-slate-700 text-slate-400">
                {processedCases.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Cases */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'active' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'active' ? 10 : -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {displayCases.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-600">
                <div className="text-center">
                  {activeTab === 'active' ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-mono">Queue Clear</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-mono">No processed cases</p>
                    </>
                  )}
                </div>
              </div>
            ) : activeTab === 'active' ? (
              <>
                <PriorityGroup label="Critical" cases={p1Cases} colorClass="text-red-400" />
                <PriorityGroup label="High" cases={p2Cases} colorClass="text-amber-400" />
                <PriorityGroup label="Medium" cases={p3Cases} colorClass="text-blue-400" />
              </>
            ) : (
              <div className="space-y-2">
                {displayCases.map(caseData => (
                  <CaseCard key={caseData.id} caseData={caseData} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default InvestigationQueue
