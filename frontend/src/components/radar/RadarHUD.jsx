import React from 'react'
import { motion } from 'framer-motion'
import { Layers, Clock, GitBranch } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const RadarHUD = () => {
  const { graphData, frozenNodes, appState } = useApp()

  const nodeCount = graphData?.nodes?.length || 0
  const frozenCount = frozenNodes.length

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 right-4 z-10"
    >
      <div className="glass-panel-dark rounded-xl px-4 py-3 space-y-2">
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
  )
}

export default RadarHUD
