import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, ShieldAlert, Lock, Unlock, Sparkles } from 'lucide-react'
import { useApp } from '../../context/AppContextSimplified'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const ContainmentActionPanel = () => {
  const { getSelectedCase, approveContainment } = useApp()
  const [isApproving, setIsApproving] = useState(false)
  const caseData = getSelectedCase()

  if (!caseData) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <p className="text-xs text-slate-600 font-mono">Select a case to review</p>
      </div>
    )
  }

  const handleApprove = () => {
    if (isApproving) return
    setIsApproving(true)
    setTimeout(() => {
      approveContainment(caseData.id)
      setIsApproving(false)
    }, 600)
  }

  const fullFreezeAmount = caseData.totalBalance
  const partialAmount = caseData.tracedAmount
  const availableAfterPartial = caseData.totalBalance - caseData.tracedAmount
  const impactPercent = ((partialAmount / fullFreezeAmount) * 100).toFixed(1)

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-950">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-800/50">
        <h2 className="text-sm font-bold text-slate-200 tracking-wide">CONTAINMENT REVIEW</h2>
        <p className="text-[11px] text-slate-500 font-mono mt-1">{caseData.id}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Summary */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="text-[10px] font-bold text-slate-400 tracking-wider">AI SUMMARY</h3>
          </div>
          <p className="text-[13px] text-slate-300 leading-relaxed">
            {caseData.aiSummary}
          </p>
        </div>

        {/* Customer Info */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50">
          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
            {caseData.customerName.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300">{caseData.customerName}</p>
            <p className="text-[10px] text-slate-500 font-mono">{caseData.victimAccount}</p>
          </div>
        </div>

        {/* Impact Comparison — The Core Innovation */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 tracking-wider">IMPACT COMPARISON</h3>

          {/* Option A: Full Freeze (Bad) */}
          <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold text-red-400">OPTION A: Full Freeze</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Frozen Amount</span>
                <span className="font-mono text-red-400">{formatCurrency(fullFreezeAmount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Available to Customer</span>
                <span className="font-mono text-red-400">₹0</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-red-500/30 mt-2">
                <div className="h-full rounded-full bg-red-500" style={{ width: '100%' }} />
              </div>
              <p className="text-[10px] text-red-400/70 mt-1">
                100% account blocked — business stops, lawsuit risk
              </p>
            </div>
          </div>

          {/* Option B: Partial Lien (Good — Recommended) */}
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 ring-1 ring-emerald-500/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">OPTION B: Partial Lien</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                RECOMMENDED
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Restricted Amount</span>
                <span className="font-mono text-amber-400">{formatCurrency(partialAmount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Available to Customer</span>
                <span className="font-mono text-emerald-400">{formatCurrency(availableAfterPartial)}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden flex">
                <div
                  className="h-full bg-amber-500/60"
                  style={{ width: `${impactPercent}%` }}
                />
                <div
                  className="h-full bg-emerald-500/60"
                  style={{ width: `${100 - parseFloat(impactPercent)}%` }}
                />
              </div>
              <p className="text-[10px] text-emerald-400/70 mt-1">
                {impactPercent}% restricted — business continues at {(100 - parseFloat(impactPercent)).toFixed(0)}% capacity
              </p>
            </div>
          </div>
        </div>

        {/* Network Overview */}
        <div className="space-y-1.5 px-3 py-2.5 rounded-lg bg-slate-900/50 border border-slate-800/50">
          <h3 className="text-[10px] font-bold text-slate-400 tracking-wider mb-1">NETWORK</h3>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Mule accounts traced</span>
            <span className="font-mono text-slate-300">{caseData.muleAccounts.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Merchant exits</span>
            <span className="font-mono text-slate-300">{caseData.merchantAccounts.length}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Recovery rate</span>
            <span className="font-mono text-emerald-400">
              {((caseData.tracedAmount / caseData.riskAmount) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Footer — Massive Action Button */}
      <div className="border-t border-slate-800/50 p-4 space-y-2">
        <motion.button
          onClick={handleApprove}
          whileHover={!isApproving ? { scale: 1.01, boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)' } : {}}
          whileTap={!isApproving ? { scale: 0.98 } : {}}
          disabled={isApproving}
          className={`w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all ${isApproving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ShieldCheck className="w-5 h-5" />
          {isApproving ? 'APPROVING...' : 'APPROVE PARTIAL HOLD'}
        </motion.button>

        <p className="text-center text-[10px] text-slate-600">
          Case will proceed to Legal Review
        </p>
      </div>
    </div>
  )
}

export default ContainmentActionPanel
