import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Clock, GitBranch, Zap, AlertTriangle, DollarSign, Shield, TrendingUp, CheckCircle } from 'lucide-react'
import { useApp, APP_STATES } from '../../context/AppContext'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const RadarHUD = () => {
  const { graphData, frozenNodes, playbackActiveNodeId, isForensicPlaybackActive, showGraph, appState } = useApp()

  const nodeCount = graphData?.nodes?.length || 0
  const frozenCount = frozenNodes.length

  // Calculate total recoverable funds secured
  const calculateRecoverableFunds = () => {
    if (!graphData?.nodes) return 0
    
    const frozenMules = graphData.nodes.filter(n => 
      n.type === 'mule' && frozenNodes.includes(n.id)
    )
    const frozenMerchants = graphData.nodes.filter(n => 
      n.type === 'merchant' && frozenNodes.includes(n.id)
    )
    
    const muleTotal = frozenMules.reduce((sum, node) => sum + (node.received_amount || 0), 0)
    const merchantTotal = frozenMerchants.reduce((sum, node) => sum + (node.traced_funds || 0), 0)
    
    return muleTotal + merchantTotal
  }

  const recoverableFunds = calculateRecoverableFunds()
  const showContainmentStatus = appState === APP_STATES.CONTAINED || appState === APP_STATES.AUDIT_LOGGED

  // Get current playback node data
  const currentNode = isForensicPlaybackActive && playbackActiveNodeId
    ? graphData.nodes?.find(n => n.id === playbackActiveNodeId)
    : null

  return (
    <>
      {/* Standard HUD - Top Right (only when not in forensic mode) */}
      <AnimatePresence mode="wait">
        {!isForensicPlaybackActive && (
          <motion.div
            key="standard-hud-panel"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 right-4 z-10"
          >
            <div className="glass-panel-dark rounded-xl px-4 py-3 space-y-2 max-w-xs">
              {/* Header */}
              <div className="flex items-center gap-2 text-xs text-slate-400 border-b border-slate-700/50 pb-2">
                <span className="font-mono tracking-wider">GRAPH CONSTRAINTS</span>
              </div>

              {/* Constraints */}
              <div className="flex flex-wrap gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <GitBranch className="w-3 h-3 text-cyan-400" />
                  <span className="text-slate-500">DEPTH:</span>
                  <span className="text-cyan-400">3 HOPS</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="text-slate-500">WINDOW:</span>
                  <span className="text-amber-400">15 MINS</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  <span className="text-slate-500">NODES:</span>
                  <span className="text-emerald-400">{nodeCount}</span>
                </div>
              </div>

              {/* Containment Status */}
              {showContainmentStatus && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-2 border-t border-cyan-500/30 space-y-2"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-mono font-bold">CONTAINMENT STATUS</span>
                  </div>
                  
                  {/* Total Recoverable Funds - Ticking Animation */}
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="p-2 rounded-lg bg-gradient-to-r from-emerald-950/50 to-cyan-950/50 border border-emerald-500/30"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-slate-400 font-mono">TOTAL SECURED</span>
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                    </div>
                    <motion.div
                      key={recoverableFunds}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-lg font-bold text-gradient-ice"
                    >
                      {formatCurrency(recoverableFunds)}
                    </motion.div>
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="text-[8px] text-emerald-400 font-mono">FUNDS SECURED</span>
                    </div>
                  </motion.div>

                  {/* Nodes Contained */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50">
                    <span className="text-[9px] text-slate-400 font-mono">NODES CONTAINED</span>
                    <span className="text-sm font-bold text-cyan-400">{frozenCount}</span>
                  </div>
                </motion.div>
              )}

              {/* Frozen Status (when investigating) */}
              {frozenCount > 0 && !showContainmentStatus && (
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 text-xs">
                    <motion.span
                      className="w-2 h-2 rounded-full bg-cyan-400"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-cyan-400 font-mono">
                      {frozenCount} NODE{frozenCount > 1 ? 'S' : ''} CONTAINED
                    </span>
                  </div>
                </div>
              )}

              {/* Legend */}
              {showGraph && (
                <div className="pt-2 border-t border-slate-700/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
                    Fraud Victim
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                    Compromised Account (Innocent)
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                    Active Participant
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#a855f7' }} />
                    Exit Point
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10b981' }} />
                    Merchant (Innocent)
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forensic Clues Panel - Bottom Center (only during forensic playback) */}
      <AnimatePresence mode="wait">
        {isForensicPlaybackActive && currentNode && (
          <motion.div
            key="forensic-clues-panel"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30"
          >
            <div className="glass-panel-dark rounded-xl px-5 py-3 space-y-2 max-w-sm w-full">
              {/* Header */}
              <div className="flex items-center gap-2 text-xs text-slate-400 border-b border-slate-700/50 pb-2">
                <span className="font-mono tracking-wider">📍 FORENSIC CLUES</span>
              </div>

              {/* Node Identity */}
              <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-900/50 rounded border border-slate-700/50 text-xs">
                <span className="text-slate-400 font-mono">NODE:</span>
                <span className="text-indigo-400 font-semibold font-mono">{currentNode.label || currentNode.id}</span>
                <span className="text-slate-600 text-xs font-mono ml-auto">({currentNode.type})</span>
              </div>

              {/* Node-specific clues with emphasis on intent */}
              {currentNode.type === 'victim' && (
                <div className="flex items-center gap-2 px-2 py-1 bg-red-950/30 rounded border border-red-900/50 text-xs">
                  <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <span className="text-red-300 font-mono">SOURCE: STOLEN FUNDS</span>
                </div>
              )}

              {currentNode.type === 'mule' && (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 px-2 py-1 bg-orange-950/30 rounded border border-orange-900/50">
                    <Zap className="w-3 h-3 text-orange-400 flex-shrink-0" />
                    <span className="text-orange-300 font-mono">VEL: {currentNode.velocity || '14'}/min</span>
                  </div>
                  <div className="px-2 py-1 text-slate-400 font-mono text-xs">
                    FR: {currentNode.fragmentation_ratio || '4.2'} | LV: {currentNode.mule_level || 1}
                  </div>
                  {currentNode.ai_reasoning?.primary_evidence?.device_fingerprint && (
                    <div className="px-2 py-1 bg-amber-950/30 rounded border border-amber-900/50 text-amber-300 font-mono text-[10px]">
                      ⚠️ Device mismatch - likely credential theft
                    </div>
                  )}
                </div>
              )}

              {currentNode.type === 'merchant' && (
                <div className="space-y-1 text-xs">
                  <div className="px-2 py-1 bg-emerald-950/30 rounded border border-emerald-900/50 text-emerald-300 font-mono">
                    MCC: {currentNode.mcc_code || '5411'} | FR: {currentNode.fragmentation_ratio || '0.0'}
                  </div>
                  {currentNode.gst_number && (
                    <div className="px-2 py-1 bg-emerald-950/30 rounded border border-emerald-900/50">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span className="text-emerald-300 font-mono text-[10px]">
                          History: 4 years low-risk KYC verified
                        </span>
                      </div>
                    </div>
                  )}
                  {currentNode.traced_funds && currentNode.current_balance && (
                    <div className="px-2 py-1 bg-cyan-950/30 rounded border border-cyan-900/50">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-300 font-mono text-[10px]">
                          Traced: {formatCurrency(currentNode.traced_funds)}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          / {formatCurrency(currentNode.current_balance)}
                        </span>
                      </div>
                      <div className="mt-1 text-[9px] text-cyan-400">
                        Only {((currentNode.traced_funds / currentNode.current_balance) * 100).toFixed(1)}% of balance - proportional lien recommended
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default RadarHUD
