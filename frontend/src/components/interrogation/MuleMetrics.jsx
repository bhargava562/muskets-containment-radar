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

const generateMuleXAIText = (node) => {
  const vel = node.velocity || 0
  const fr = node.fragmentation_ratio || 0
  const dwell = node.ai_reasoning?.primary_evidence?.dwell_time || 'unknown'
  const age = node.ai_reasoning?.account_age_days || node.account_age_days || 0
  const ip = node.ai_reasoning?.primary_evidence?.ip_telemetry || ''
  const device = node.ai_reasoning?.primary_evidence?.device_fingerprint || ''

  const lines = []

  if (vel > 10) {
    lines.push(`Transaction velocity is ${vel} per minute - a legitimate customer averages 0.5 per day. This account moved money ${vel * 2} times faster than normal, which is a strong indicator of scripted or criminal activity.`)
  }
  if (fr > 3) {
    lines.push(`Fragmentation ratio is ${fr.toFixed(1)} - the account split incoming funds into ${Math.round(fr)} smaller transfers within minutes. Normal accounts do not fragment money this way. This pattern is called "smurfing" and is designed to evade detection thresholds.`)
  }
  if (dwell && dwell !== 'unknown') {
    lines.push(`Money stayed in this account for only ${dwell} before being forwarded. Legitimate customers hold funds for days. A dwell time under 2 minutes means this account was used as a pass-through, not a real account.`)
  }
  if (age > 0 && age < 20) {
    lines.push(`This account was opened only ${age} days ago. New accounts receiving large transfers immediately after creation are a known mule account pattern identified by RBI AML guidelines.`)
  }
  if (ip.includes('VPN') || ip.includes('TOR')) {
    lines.push("Login came from a VPN or anonymized IP address. The account holder's registered address does not match the login location. This indicates the login was not made by the legitimate account holder.")
  }
  if (device.includes('mismatch') || device.includes('Spoofed')) {
    lines.push("The device used to initiate these transactions does not match the device on the account's KYC profile. This is strong evidence that someone other than the account holder was operating this account.")
  }

  return lines.length > 0
    ? lines
    : ['Behavioral pattern analysis indicates suspicious fund movement inconsistent with normal account activity.']
}

const MuleMetrics = ({ node, isContained = false }) => {
  const { deployNetworkContainment, frozenNodes } = useApp()
  const isFrozen = frozenNodes.includes(node.id) || isContained
  const aiReasoning = node.ai_reasoning || {}

  const handleContainment = () => {
    if (!isFrozen) {
      deployNetworkContainment()
    }
  }

  const velocity = node.velocity || 14
  const fragmentationRatio = node.fragmentation_ratio || 4.2
  const receivedAmount = node.received_amount || 80000
  const nodeSubtype = node.nodeSubtype

  const subtypeBadge = (() => {
    if (nodeSubtype === 'COMPROMISED') {
      return { text: 'COMPROMISED ACCOUNT - Likely innocent person\'s credentials were stolen', tone: 'bg-amber-500/20 text-amber-300 border-amber-400/40' }
    }
    if (nodeSubtype === 'EXIT_POINT') {
      return { text: 'EXIT POINT - Final hop before cash left the network', tone: 'bg-red-950/60 text-red-300 border-red-500/60' }
    }
    return { text: 'ACTIVE PARTICIPANT - Behavioral signals indicate willing involvement', tone: 'bg-red-500/20 text-red-300 border-red-400/40' }
  })()

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

        <div className={`rounded-md border px-2 py-1 text-[9px] leading-4 ${subtypeBadge.tone}`}>
          {subtypeBadge.text}
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
          {generateMuleXAIText(node).map((evidence) => (
            <motion.div
              key={`mule-evidence-${node.id}-${evidence}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-1.5 p-1.5 rounded-md bg-red-950/20 border border-red-500/10"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
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
          onClick={handleContainment}
          className="w-full py-2.5 px-4 rounded-lg btn-danger text-white font-bold text-xs flex items-center justify-center gap-2"
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

export default MuleMetrics