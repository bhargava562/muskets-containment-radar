import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, ChevronLeft, ChevronRight, FileText, Activity, CreditCard, User, Landmark } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'
import CaseNotesPanel from './CaseNotesPanel'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

export default function CaseOverviewRail() {
  const { context } = useInvestigation()
  const [collapsed, setCollapsed] = useState(false)

  if (!context || !context.snapshot) return null
  const snap = context.snapshot

  return (
    <div className="relative h-full flex flex-col bg-slate-950 border-r border-slate-900/60 transition-all duration-300 overflow-hidden flex-shrink-0" style={{ width: collapsed ? '48px' : '300px' }}>
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-4 right-2 z-10 p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {collapsed ? (
        <div className="flex flex-col items-center pt-16 space-y-6">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Shield className="w-4 h-4" />
          </div>
          <div className="p-2 rounded-lg bg-slate-800/50 text-slate-400">
            <FileText className="w-4 h-4" />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 pt-5 border-b border-slate-900/60 bg-slate-950 flex flex-col gap-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">CANONICAL CASE STATE</span>
            <div className="flex items-center gap-2">
              <h2 className="text-md font-bold text-slate-200">{snap.caseId}</h2>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Details Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Snapshot Stats */}
            <div className="space-y-3.5 bg-slate-900/20 p-3.5 rounded-xl border border-slate-900">
              <div className="flex items-center justify-between border-b border-slate-900/60 pb-2">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-500" /> Snapshot
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">
                  {snap.priority}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Risk Amount</span>
                  <p className="font-mono font-bold text-slate-200">{formatCurrency(snap.riskAmount)}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Traced Target</span>
                  <p className="font-mono font-bold text-cyan-400">{formatCurrency(snap.tracedAmount)}</p>
                </div>
              </div>
            </div>

            {/* Target Account Summary */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-2">
                <Landmark className="w-3.5 h-3.5 text-slate-500" /> Target Account Details
              </h3>
              <div className="p-3 bg-slate-900/10 border border-slate-900 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Account ID</span>
                  <span className="font-mono text-slate-300 font-semibold">{snap.accountId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Holder Name</span>
                  <span className="text-slate-300 font-semibold">{snap.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Balance</span>
                  <span className="font-mono text-slate-300">{formatCurrency(snap.totalBalance)}</span>
                </div>
              </div>
            </div>

            {/* Case Notes Panel Integration */}
            <div className="pt-2 border-t border-slate-900/60">
              <CaseNotesPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
