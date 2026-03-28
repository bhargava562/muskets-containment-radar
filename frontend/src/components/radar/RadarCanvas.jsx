import { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { AnimatePresence } from 'framer-motion'
import { useApp, APP_STATES } from '../../context/AppContext'
import { drawNode, getLinkColor, getLinkWidth, updatePulsePhase } from '../../utils/nodeRenderer'
import RadarGrid from './RadarGrid'
import RadarHUD from './RadarHUD'

const RadarCanvas = () => {
  const graphRef = useRef(null)
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const { showGraph, graphData, frozenNodes, selectNode, selectedNode, appState, activeAnalyzingNode } = useApp()

  // Handle responsive sizing
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

  // Animation loop for pulsing/analyzing effects - only update pulse phase
  useEffect(() => {
    if (!showGraph || !activeAnalyzingNode) return
    
    const intervalId = setInterval(() => {
      updatePulsePhase()
      // Trigger a lightweight repaint without re-simulating physics
      if (graphRef.current) {
        graphRef.current.refresh()
      }
    }, 50) // ~20fps for smooth animation

    return () => clearInterval(intervalId)
  }, [showGraph, activeAnalyzingNode])

  // Zoom to fit when graph appears or new nodes are added
  useEffect(() => {
    if (showGraph && graphRef.current && graphData.nodes.length > 0) {
      setTimeout(() => {
        graphRef.current.zoomToFit(400, 100)
      }, 300)
    }
  }, [showGraph, graphData.nodes.length])

  // Re-heat simulation when graph data changes
  useEffect(() => {
    if (showGraph && graphRef.current && graphData.nodes.length > 0) {
      graphRef.current.d3ReheatSimulation()
    }
  }, [graphData])

  // Custom node renderer
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const isSelected = selectedNode?.id === node.id
    drawNode(node, ctx, globalScale, frozenNodes, isSelected, activeAnalyzingNode)
  }, [frozenNodes, selectedNode, activeAnalyzingNode])

  // Handle node click
  const handleNodeClick = useCallback((node) => {
    // Only allow clicking on nodes that aren't currently being analyzed
    if (
      (appState === APP_STATES.INVESTIGATING ||
        appState === APP_STATES.CONTAINED ||
        appState === APP_STATES.AUDIT_LOGGED) &&
      node.id !== activeAnalyzingNode
    ) {
      selectNode(node)

      // Center on clicked node
      if (graphRef.current) {
        graphRef.current.centerAt(node.x, node.y, 300)
        graphRef.current.zoom(2.5, 300)
      }
    }
  }, [selectNode, appState, activeAnalyzingNode])

  // Link color based on frozen state
  const linkColor = useCallback((link) => {
    return getLinkColor(link, frozenNodes)
  }, [frozenNodes])

  // Determine if particles should flow
  const showParticles = (
    appState === APP_STATES.TRACING ||
    appState === APP_STATES.INVESTIGATING
  ) && frozenNodes.length === 0

  // Memoize graph data to prevent unnecessary re-renders
  const memoizedGraphData = useMemo(() => {
    if (!showGraph) return { nodes: [], links: [] }
    return {
      nodes: graphData.nodes.map(n => ({ ...n })),
      links: graphData.links.map(l => ({ ...l }))
    }
  }, [showGraph, graphData])

  return (
    <div ref={containerRef} className="h-full w-full glass-panel rounded-2xl overflow-hidden relative">
      {/* Empty State - Radar Grid */}
      <AnimatePresence>
        {!showGraph && (
          <motion.div
            key="radar-grid"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <RadarGrid />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Graph */}
      <AnimatePresence>
        {showGraph && (
          <motion.div
            key="force-graph"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
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
              onNodeClick={handleNodeClick}
              linkColor={linkColor}
              linkWidth={(link) => getLinkWidth(link)}
              linkDistance={120}
              linkDirectionalParticles={showParticles ? 4 : 0}
              linkDirectionalParticleWidth={2.5}
              linkDirectionalParticleSpeed={0.006}
              linkDirectionalParticleColor={() => 'rgba(239, 68, 68, 0.9)'}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.35}
              cooldownTicks={150}
              enableNodeDrag={true}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              minZoom={0.5}
              maxZoom={4}
            />

            {/* HUD Overlay */}
            <RadarHUD />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tracing State Overlay */}
      {appState === APP_STATES.TRACING && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-mono font-semibold text-amber-400">
                TRACING FUND LINEAGE...
              </span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Frozen Overlay Effect */}
      {frozenNodes.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent animate-frost-shimmer" />
        </div>
      )}
    </div>
  )
}

export default RadarCanvas