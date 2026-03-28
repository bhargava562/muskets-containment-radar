import { useState, useEffect } from 'react'
import { CheckCircle, CreditCard, Smartphone, Building } from 'lucide-react'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const AlertCard = ({ transaction }) => {
  const [timeAgo, setTimeAgo] = useState('')

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

  return (
    <div className="w-full flex-shrink-0 glass-panel-dark rounded-xl p-4 border-l-2 border-emerald-500/40 hover:border-emerald-400/70 transition-all hover:bg-slate-800/30">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-500/10">
            {getTxnIcon()}
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400">{transaction.id}</span>
            <span className="mx-1.5 text-slate-600">•</span>
            <span className="text-xs font-mono text-emerald-400/80">{transaction.txnType}</span>
          </div>
        </div>
        <span className="text-xs text-slate-500 font-mono">{timeAgo}</span>
      </div>

      {/* Main Content */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{transaction.merchant}</p>
          <p className="text-xs text-slate-500 mt-1">{getDescription()}</p>
          {transaction.location && (
            <p className="text-xs text-slate-600 font-mono mt-1">{transaction.location}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-emerald-400">{formatCurrency(transaction.amount)}</p>
          <div className="flex items-center justify-end gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500 font-mono">{transaction.status}</span>
          </div>
        </div>
      </div>

      {/* AI Analysis Badge (if available) */}
      {transaction.aiAnalysis && (
        <div className="mt-3 pt-3 border-t border-slate-700/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">AI Risk Assessment:</span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${
              transaction.aiAnalysis.risk_level === 'LOW'
                ? 'bg-emerald-500/20 text-emerald-400'
                : transaction.aiAnalysis.risk_level === 'MEDIUM'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {transaction.aiAnalysis.risk_level}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlertCard