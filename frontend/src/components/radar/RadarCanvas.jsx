import { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../../context/AppContextSimplified'

// Node colors by type
const NODE_COLORS = {
  victim: { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)', label: 'Victim' },
  mule: { fill: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)', label: 'Mule' },
  merchant: { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.3)', label: 'Merchant' }
}

const drawNode = (node, ctx, globalScale) => {
  const config = NODE_COLORS[node.type] || NODE_COLORS.mule
  const size = 7
  const fontSize = Math.max(10 / globalScale, 3)

  // Glow
  ctx.shadowColor = config.glow
  ctx.shadowBlur = 15

  // Circle
  ctx.fillStyle = config.fill
  ctx.beginPath()
  ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)
  ctx.fill()

  // Reset shadow
  ctx.shadowBlur = 0

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 0.8
  ctx.stroke()

  // Label
  if (globalScale > 0.6) {
    ctx.font = `500 ${fontSize}px Inter, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillText(node.label || '', node.x, node.y + size + 4)
  }
}

const RadarCanvas = () => {
  const graphRef = useRef(null)
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const { getSelectedCase, getGraphForCase } = useApp()

  const selectedCase = getSelectedCase()
  const graphData = selectedCase ? getGraphForCase(selectedCase.graphId) : null

  // Responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        })
      }
    }
    updateDimensions()
    const observer = new ResizeObserver(updateDimensions)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Zoom to fit
  useEffect(() => {
    if (graphRef.current && graphData?.nodes?.length > 0) {
      setTimeout(() => {
        graphRef.current.zoomToFit(400, 60)
      }, 200)
    }
  }, [graphData])

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    drawNode(node, ctx, globalScale)
  }, [])

  const memoizedGraphData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] }
    return {
      nodes: (graphData.nodes || []).map(n => ({ ...n })),
      links: (graphData.links || []).map(l => ({ ...l }))
    }
  }, [graphData])

  const showGraph = !!selectedCase && memoizedGraphData.nodes.length > 0

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden relative bg-slate-950">
      {/* Empty State */}
      <AnimatePresence mode="wait">
        {!showGraph && (
          <motion.div
            key="empty"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Subtle grid */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.05]">
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            <div className="text-center z-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-slate-800 flex items-center justify-center">
                <motion.div
                  className="w-2 h-2 rounded-full bg-slate-600"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>
              <p className="text-xs text-slate-600 font-mono">Select a case to view the fund network</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Graph */}
      <AnimatePresence mode="wait">
        {showGraph && (
          <motion.div
            key={selectedCase.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <ForceGraph2D
              ref={graphRef}
              graphData={memoizedGraphData}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor="transparent"
              nodeCanvasObject={nodeCanvasObject}
              nodePointerAreaPaint={(node, color, ctx) => {
                if (typeof node.x !== 'number' || typeof node.y !== 'number') return
                ctx.fillStyle = color
                ctx.beginPath()
                ctx.arc(node.x, node.y, 14, 0, 2 * Math.PI)
                ctx.fill()
              }}
              linkColor={() => 'rgba(239, 68, 68, 0.25)'}
              linkWidth={1.5}
              linkDirectionalParticles={3}
              linkDirectionalParticleWidth={2.5}
              linkDirectionalParticleSpeed={0.005}
              linkDirectionalParticleColor={() => 'rgba(239, 68, 68, 0.7)'}
              linkDirectionalArrowLength={6}
              linkDirectionalArrowRelPos={0.85}
              linkDirectionalArrowColor={() => 'rgba(239, 68, 68, 0.4)'}
              d3AlphaDecay={0.04}
              d3VelocityDecay={0.25}
              cooldownTicks={200}
              enableNodeDrag={true}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              minZoom={0.3}
              maxZoom={6}
            />

            {/* Legend */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-4 left-4 flex items-center gap-4 px-3 py-2 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-800/50"
            >
              {Object.entries(NODE_COLORS).map(([type, config]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.fill }} />
                  <span className="text-[10px] text-slate-400 capitalize">{config.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Case ID badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-800/50"
            >
              <span className="text-[10px] font-mono text-slate-400">{selectedCase.id}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RadarCanvas
