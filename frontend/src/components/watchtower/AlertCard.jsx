import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, CreditCard, Smartphone, Building, ChevronDown } from 'lucide-react'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const AlertCard = ({ transaction }) => {
  const [timeAgo, setTimeAgo] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const seconds = Math.floor((Date.now() - new Date(transaction.timestamp)) / 1000)
      if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`)
      } else {
        const minutes = Math.floor(seconds / 60)
        setTimeAgo(`${minutes}m ago`)
      }
    }
    
    updateTime()
    const interval = setInterval(updateTime, 10000) // Update every 10 seconds
    
    return () => clearInterval(interval)
  }, [transaction.timestamp])

  // Get transaction type icon
  const getTxnIcon = () => {
    switch (transaction.txnType) {
      case 'UPI/P2P':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
      case 'NEFT':
        return <Building className="w-3.5 h-3.5 text-emerald-500" />
      case 'IMPS':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
      default:
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
    }
  }

  // Generate human readable description
  const getDescription = () => {
    if (transaction.mccDescription) {
      return `Normal ${transaction.txnType} Payment - ${transaction.mccDescription}`
    }
    return `${transaction.txnType} Transaction`
  }

  const maskedDevice = 'DEV-****'
  const anomalyScore = transaction.aiAnalysis?.anomaly_score || 0
  const riskLevel = transaction.aiAnalysis?.risk_level || 'LOW'

  return (
    <div className="w-full flex-shrink-0 glass-panel-dark rounded-xl border-l-2 border-emerald-500/40 hover:border-emerald-400/70 transition-all hover:bg-slate-800/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-md bg-emerald-500/10">
            {getTxnIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400">
                {transaction.txnType}
              </span>
              <span className="text-xs text-slate-200 font-medium truncate">{transaction.merchant}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-emerald-400">{formatCurrency(transaction.amount)}</p>
            <span className="text-[10px] text-slate-500 font-mono">{timeAgo}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1.5 rounded-full bg-slate-900/60 text-slate-400 hover:text-slate-200 transition"
            aria-label="Toggle details"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-4 pt-2 border-t border-slate-700/40 space-y-2 overflow-hidden"
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>UTR: {transaction.utr}</span>
              <span>{transaction.mccDescription || getDescription()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-md bg-slate-900/60 px-2 py-1 text-slate-400 font-mono">
                Device: {maskedDevice}
              </div>
              <div className="rounded-md bg-slate-900/60 px-2 py-1 text-slate-400 font-mono truncate">
                {transaction.location || 'Location unavailable'}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">AI Risk Level</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  riskLevel === 'LOW'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : riskLevel === 'MEDIUM'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {riskLevel}
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span>Anomaly Score</span>
                <span>{(anomalyScore * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-1.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400"
                  style={{ width: `${Math.min(anomalyScore * 100, 100)}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AlertCard