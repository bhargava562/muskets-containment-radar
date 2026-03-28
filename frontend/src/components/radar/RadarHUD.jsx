import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Clock, GitBranch, Zap, AlertTriangle } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const RadarHUD = () => {
  const { graphData, frozenNodes, playbackActiveNodeId, isForensicPlaybackActive } = useApp()

  const nodeCount = graphData?.nodes?.length || 0
  const frozenCount = frozenNodes.length

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

              {/* Frozen Status */}
              {frozenCount > 0 && (
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

              {/* Node-specific clues */}
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
                    <span className="text-orange-300 font-mono">VEL: {currentNode.velocity_per_minute || '14'}/min</span>
                  </div>
                  <div className="px-2 py-1 text-slate-400 font-mono text-xs">
                    FR: {currentNode.fragmentation_ratio || '4.2'} | LV: {currentNode.mule_level || 1}
                  </div>
                </div>
              )}

              {currentNode.type === 'merchant' && (
                <div className="space-y-1 text-xs">
                  <div className="px-2 py-1 bg-emerald-950/30 rounded border border-emerald-900/50 text-emerald-300 font-mono">
                    MCC: {currentNode.mcc_code || '5411'} | FR: {currentNode.fragmentation_ratio || '0.0'}
                  </div>
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