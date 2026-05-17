import { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../../context/AppContextSimplified'
import RadarGrid from './RadarGrid'

// Simple node renderer without overlays
const drawSimpleNode = (node, ctx, globalScale) => {
  const nodeSize = 8 / globalScale

  // Node colors
  let color = '#94a3b8' // Default slate
  if (node.type === 'victim') color = '#3b82f6' // Blue
  if (node.type === 'mule') color = '#ef4444' // Red
  if (node.type === 'merchant') color = '#10b981' // Green

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI)
  ctx.fill()

  // Node border
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 0.5
  ctx.stroke()
}

const getLinkColorSimple = (link) => {
  // Money flow: red with transparency
  return 'rgba(239, 68, 68, 0.4)'
}

const RadarCanvas = () => {
  const graphRef = useRef(null)
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const { getSelectedCase, getCaseGraphData } = useApp()

  const selectedCase = getSelectedCase()
  const graphData = selectedCase ? getCaseGraphData(selectedCase.graphStructureId) : null

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
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Zoom to fit when graph loads
  useEffect(() => {
    if (graphRef.current && graphData?.nodes?.length > 0) {
      setTimeout(() => {
        graphRef.current.zoomToFit(400, 80)
      }, 100)
    }
  }, [graphData])

  // Custom node renderer
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    drawSimpleNode(node, ctx, globalScale)
  }, [])

  // Handle node hover for tooltip
  const handleNodeHover = useCallback((node) => {
    if (graphRef.current) {
      graphRef.current.nodePointerAreaPaint = (n, color, ctx) => {
        if (n === node) {
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(n.x, n.y, 12, 0, 2 * Math.PI)
          ctx.fill()
        }
      }
    }
  }, [])

  // Memoize graph data
  const memoizedGraphData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] }
    return {
      nodes: graphData.nodes || [],
      links: graphData.links || []
    }
  }, [graphData])

  const showGraph = !!selectedCase && memoizedGraphData.nodes.length > 0

  return (
    <div ref={containerRef} className="h-full w-full rounded-lg overflow-hidden relative bg-slate-50 border">
      {/* Empty State - Radar Grid */}
      <AnimatePresence mode="wait">
        {!showGraph && (
          <motion.div
            key="radar-grid-state"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <RadarGrid />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-slate-500">Select a case to see the transaction network</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Graph */}
      <AnimatePresence mode="wait">
        {showGraph && (
          <motion.div
            key="force-graph-state"
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
                if (typeof node.x !== 'number' || typeof node.y !== 'number' ||
                    !isFinite(node.x) || !isFinite(node.y)) {
                  return
                }
                ctx.fillStyle = color
                ctx.beginPath()
                ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI)
                ctx.fill()
              }}
              onNodeHover={handleNodeHover}
              linkColor={getLinkColorSimple}
              linkWidth={1}
              linkDistance={100}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={2}
              linkDirectionalParticleSpeed={0.006}
              linkDirectionalParticleColor={() => 'rgba(239, 68, 68, 0.8)'}
              d3AlphaDecay={0.05}
              d3VelocityDecay={0.3}
              cooldownTicks={150}
              d3ForceConfig={{
                charge: { strength: -400, distanceMax: 350 },
                link: { distance: 100 }
              }}
              enableNodeDrag={true}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              minZoom={0.4}
              maxZoom={5}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RadarCanvas
