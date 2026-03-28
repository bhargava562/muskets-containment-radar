import { motion } from 'framer-motion'
import { AlertTriangle, Shield, Snowflake, CheckCircle, Cpu, Fingerprint, Clock, TrendingUp } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const MuleMetrics = ({ node, isContained = false }) => {
  const { freezeNode, frozenNodes } = useApp()
  const isFrozen = frozenNodes.includes(node.id) || isContained
  const aiReasoning = node.ai_reasoning || {}

  const handleFreeze = () => {
    if (!isFrozen) {
      freezeNode(node.id, node)
    }
  }

  const velocity = node.velocity || 14
  const fragmentationRatio = node.fragmentation_ratio || 4.2
  const receivedAmount = node.received_amount || 80000

  return (
    <div className="space-y-3">
      {/* Threat Metrics */}
      <div className="glass-panel-dark rounded-lg p-3 border-l-2 border-red-500">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-red-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[10px] font-bold text-red-400 tracking-wide">THREAT PROFILE</h3>
            <p className="text-[9px] text-slate-500 font-mono">
              {node.mule_level === 1 ? 'Primary Mule' : node.mule_level === 2 ? 'Secondary Mule' : node.mule_level === 3 ? 'Tertiary Mule' : `Level ${node.mule_level || 1} Mule`}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {/* Velocity */}
          <div className="p-2 rounded-md bg-slate-800/50">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-red-400" />
                <span className="text-[9px] text-slate-400 font-mono">PROPAGATION VELOCITY</span>
              </div>
              <span className="text-[10px] font-bold text-red-400">{velocity} tx/min</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-1">
              <div
                className="bg-gradient-to-r from-red-500 to-orange-500 h-1 rounded-full"
                style={{ width: `${Math.min(velocity / 20 * 100, 100)}%` }}
              />
            </div>
            <p className="text-[8px] text-red-400/80 mt-1">Threshold: 5 tx/min</p>
          </div>

          {/* Fragmentation */}
          <div className="p-2 rounded-md bg-slate-800/50">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Fingerprint className="w-3 h-3 text-red-400" />
                <span className="text-[9px] text-slate-400 font-mono">FRAGMENTATION RATIO</span>
              </div>
              <span className="text-[10px] font-bold text-red-400">{fragmentationRatio}</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-1">
              <div
                className="bg-gradient-to-r from-orange-500 to-red-500 h-1 rounded-full"
                style={{ width: `${Math.min(fragmentationRatio / 5 * 100, 100)}%` }}
              />
            </div>
            <p className="text-[8px] text-red-400/80 mt-1">Normal: &lt; 1.0</p>
          </div>

          {/* Account Age */}
          {aiReasoning.account_age_days && (
            <div className="flex items-center justify-between p-2 rounded-md bg-red-950/30 border border-red-500/20">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-amber-400" />
                <span className="text-[9px] text-slate-400 font-mono">ACCOUNT AGE</span>
              </div>
              <span className="text-[10px] font-bold text-amber-400">{aiReasoning.account_age_days} days</span>
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
          {(aiReasoning.evidence || [
            `Velocity exceeds threshold: ${velocity} tx/min`,
            `Fragmentation ratio critically high: ${fragmentationRatio}`,
            'Immediate outward fragmentation detected',
            'Device IP matches known risky cluster'
          ]).map((evidence, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-start gap-1.5 p-1.5 rounded-md bg-red-950/20 border border-red-500/10"
            >
              <span className="text-red-400 text-[10px] mt-0.5 flex-shrink-0">⚠</span>
              <span className="text-[10px] text-slate-300 break-words">{evidence}</span>
            </motion.div>
          ))}
        </div>

        {aiReasoning.confidence && (
          <div className="mt-2 pt-2 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-slate-500">AI Confidence:</span>
              <span className="font-mono text-red-400 font-semibold">
                {(aiReasoning.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Account Details */}
      <div className="glass-panel-dark rounded-lg p-3">
        <h3 className="text-[9px] text-slate-500 mb-2 font-mono">ACCOUNT METADATA</h3>
        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
          <div className="p-2 rounded-md bg-slate-800/50 min-w-0">
            <span className="text-slate-500 block mb-0.5">ACCOUNT</span>
            <span className="text-slate-300 truncate block">{node.account_number}</span>
          </div>
          <div className="p-2 rounded-md bg-slate-800/50 min-w-0">
            <span className="text-slate-500 block mb-0.5">IFSC</span>
            <span className="text-slate-300 truncate block">{node.ifsc_code}</span>
          </div>
          <div className="col-span-2 p-2 rounded-md bg-red-950/30 border border-red-500/20">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">RECEIVED AMOUNT</span>
              <span className="text-sm font-bold text-red-400">{formatCurrency(receivedAmount)}</span>
            </div>
          </div>
          <div className="col-span-2 p-2 rounded-md bg-slate-800/50">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">CURRENT BALANCE</span>
              <span className="text-amber-400 font-semibold text-[10px]">{formatCurrency(node.current_balance || 12450)}</span>
            </div>
          </div>
        </div>
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
              <span className="text-xs font-bold text-cyan-400">ACCOUNT FROZEN</span>
              <p className="text-[9px] text-slate-400">Full balance hold applied</p>
            </div>
          </div>
          <div className="p-2 rounded-md bg-cyan-950/30 border border-cyan-500/20">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-mono">HOLD AMOUNT</span>
              <span className="text-sm font-bold text-cyan-400">{formatCurrency(receivedAmount)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[9px] text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            <span>Freeze order executed successfully</span>
          </div>
        </motion.div>
      ) : (
        <motion.button
          onClick={handleFreeze}
          className="w-full py-2.5 px-4 rounded-lg btn-danger text-white font-bold text-xs flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Shield className="w-4 h-4" />
          INITIATE FULL ACCOUNT FREEZE
        </motion.button>
      )}
    </div>
  )
}

export default MuleMetrics