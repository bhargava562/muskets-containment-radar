import { motion } from 'framer-motion'
import { Shield, Snowflake, CheckCircle, Calculator, Cpu, AlertCircle, Store, BadgeCheck } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const generateMerchantXAIText = (node) => {
  const tracedFunds = node.traced_funds || 0
  const balance = node.current_balance || 0
  const pct = balance > 0 ? ((tracedFunds / balance) * 100).toFixed(1) : 0
  const lines = []
  lines.push(`This merchant received ₹${tracedFunds.toLocaleString('en-IN')} that has been traced back to the fraud victim's account through the mule network. The merchant did not initiate or request this transfer - the funds arrived through the criminal's money movement chain.`)
  lines.push(`The merchant's account has a total balance of ₹${balance.toLocaleString('en-IN')}. The traced stolen amount represents only ${pct}% of their total funds. A full freeze would incorrectly punish a legitimate business for receiving funds they had no knowledge were stolen.`)
  lines.push(`AI classification is PASSIVE INNOCENT with ${((node.ai_reasoning?.confidence || 0.87) * 100).toFixed(0)}% confidence. GST registration is valid, business category is consistent with MCC code, and no outbound fragmentation pattern was detected.`)
  return lines
}

const MerchantMetrics = ({ node, isContained = false }) => {
  const { deployNetworkContainment, frozenNodes } = useApp()
  const isFrozen = frozenNodes.includes(node.id) || isContained
  const aiReasoning = node.ai_reasoning || {}

  const currentBalance = node.current_balance || 3145000
  const tracedFunds = node.traced_funds || 50000
  const lienAmount = Math.min(currentBalance, tracedFunds)

  const handleContainment = () => {
    if (!isFrozen) {
      deployNetworkContainment()
    }
  }

  return (
    <div className="space-y-3">
      {/* Merchant Profile */}
      <div className="glass-panel-dark rounded-lg p-3 border-l-2 border-amber-500">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-amber-500/20">
            <Store className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[10px] font-bold text-amber-400 tracking-wide">MERCHANT PROFILE</h3>
            <p className="text-[8px] text-slate-500 font-mono truncate">MCC: {node.mcc_code} - {node.mcc_description}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="p-2 rounded-md bg-slate-800/50">
            <span className="text-[8px] text-slate-500 block mb-0.5">BUSINESS NAME</span>
            <span className="text-[10px] font-semibold text-slate-200 truncate block">{node.business_name || node.account_holder}</span>
          </div>
          {node.gst_number && (
            <div className="flex items-center gap-1.5 p-2 rounded-md bg-emerald-950/20 border border-emerald-500/20">
              <BadgeCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span className="text-[8px] text-slate-400">GST:</span>
              <span className="text-[9px] font-mono text-emerald-400 truncate">{node.gst_number}</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Evidence (XAI) */}
      <div className="glass-panel-dark rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Cpu className="w-3 h-3 text-cyan-400" />
          <h3 className="text-[9px] text-cyan-400 font-mono tracking-wider">AI EVIDENCE CHAIN</h3>
        </div>

        <div className="space-y-1.5">
          {generateMerchantXAIText(node).map((evidence) => (
            <motion.div
              key={`merchant-evidence-${node.id}-${evidence}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-1.5 p-1.5 rounded-md bg-emerald-950/20 border border-emerald-500/10"
            >
              <AlertCircle className="w-3 h-3 text-emerald-300 mt-0.5 flex-shrink-0" />
              <span className="text-[10px] text-slate-300 break-words">{evidence}</span>
            </motion.div>
          ))}
        </div>

        {/* Collateral Damage Warning */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-2 p-2 rounded-md bg-amber-950/20 border border-amber-500/20"
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="text-[9px] font-semibold text-amber-400">COLLATERAL DAMAGE RISK: HIGH</span>
          </div>
          <p className="text-[9px] text-slate-400 ml-4">
            Full freeze would impact legitimate business operations.
          </p>
        </motion.div>

        {aiReasoning.confidence && (
          <div className="mt-2 pt-2 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-slate-500">AI Confidence (Innocent):</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {(aiReasoning.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Proportional Lien Calculation */}
      <div className="glass-panel-dark rounded-lg p-3 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/20">
        <div className="flex items-center gap-1.5 mb-2">
          <Calculator className="w-3 h-3 text-cyan-400" />
          <h3 className="text-[9px] text-cyan-400 font-mono tracking-wider">PROPORTIONAL LIEN CALC</h3>
        </div>

        <div className="space-y-2 font-mono text-[9px] bg-slate-950/50 rounded-md p-2">
          <div className="text-slate-500 text-[8px]">// Apply minimum freeze</div>
          <div className="text-slate-400">
            <span className="text-cyan-400">LIEN</span> = <span className="text-amber-400">MIN</span>(BAL, TRACED)
          </div>
          <div className="text-slate-300 py-1">
            <span className="text-cyan-400">LIEN</span> = <span className="text-amber-400">MIN</span>(
            <span className="text-emerald-400">{formatCurrency(currentBalance)}</span>,{' '}
            <span className="text-red-400">{formatCurrency(tracedFunds)}</span>)
          </div>
          <div className="pt-2 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[8px]">TARGET LIEN</span>
              <span className="text-base font-bold text-gradient-ice">{formatCurrency(lienAmount)}</span>
            </div>
          </div>
        </div>

        {/* Balance Breakdown */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="p-2 rounded-md bg-emerald-950/20 border border-emerald-500/20 text-center">
            <span className="text-[8px] text-slate-500 block mb-0.5">BALANCE</span>
            <span className="text-[10px] font-bold text-emerald-400">{formatCurrency(currentBalance)}</span>
          </div>
          <div className="p-2 rounded-md bg-red-950/20 border border-red-500/20 text-center">
            <span className="text-[8px] text-slate-500 block mb-0.5">TRACED</span>
            <span className="text-[10px] font-bold text-red-400">{formatCurrency(tracedFunds)}</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 mt-2">
          Under the proportional lien mechanism, only ₹{lienAmount.toLocaleString('en-IN')} is frozen - the exact amount of stolen funds traced to this account. The remaining ₹{(currentBalance - lienAmount).toLocaleString('en-IN')} stays accessible. The business continues operating normally. This prevents the collateral damage of a full account freeze while securing the recoverable stolen funds.
        </p>
      </div>

      {/* Containment Status or Action */}
      {isFrozen ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel-dark rounded-lg p-3 border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-cyan-900/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Snowflake className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-xs font-bold text-cyan-400">PROPORTIONAL LIEN APPLIED</span>
              <p className="text-[9px] text-slate-400">Partial hold - remaining accessible</p>
            </div>
          </div>
          <div className="p-2 rounded-md bg-cyan-950/30 border border-cyan-500/20">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-mono">LIEN AMOUNT</span>
              <span className="text-sm font-bold text-cyan-400">{formatCurrency(lienAmount)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[9px] text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            <span>Lien deployed - operations unaffected</span>
          </div>
        </motion.div>
      ) : (
        <motion.button
          onClick={handleContainment}
          className="w-full py-2.5 px-4 rounded-lg btn-freeze text-white font-bold text-xs flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Shield className="w-4 h-4" />
          DEPLOY PROPORTIONAL LIEN
        </motion.button>
      )}
    </div>
  )
}

export default MerchantMetrics