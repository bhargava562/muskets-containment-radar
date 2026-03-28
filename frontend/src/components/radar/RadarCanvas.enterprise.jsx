import { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp, APP_STATES } from '../../context/AppContext'
import { drawNode, getLinkColor, getLinkWidth } from '../../utils/nodeRenderer.enterprise'
import RadarGrid from './RadarGrid'
import RadarHUD from './RadarHUD'

const RadarCanvas = () => {
  const graphRef = useRef(null)
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [cascadePhase, setCascadePhase] = useState(0) // 0=hidden, 1=victims, 2=hop1, 3=hop2, 4=complete
  const { showGraph, graphData, frozenNodes, selectNode, selectedNode, appState } = useApp()

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

  // Zoom to fit when graph stabilizes
  useEffect(() => {
    if (showGraph && graphRef.current && graphData.nodes.length > 0 && cascadePhase === 4) {
      setTimeout(() => {
        graphRef.current.zoomToFit(300, 80)
      }, 200)
    }
  }, [showGraph, graphData.nodes.length, cascadePhase])

  // RAPID BFS CASCADE - 900ms total
  useEffect(() => {
    if (!showGraph || graphData.nodes.length === 0) {
      setCascadePhase(0)
      return
    }

    // Start cascade immediately
    setCascadePhase(1) // Show victims

    const timers = []

    // T+300ms: Reveal Hop 1 (Mules directly connected to victims)
    timers.push(setTimeout(() => {
      setCascadePhase(2)
    }, 300))

    // T+600ms: Reveal Hop 2 (Merchants/Sub-mules)
    timers.push(setTimeout(() => {
      setCascadePhase(3)
    }, 600))

    // T+900ms: Complete - all visible
    timers.push(setTimeout(() => {
      setCascadePhase(4)
    }, 900))

    return () => timers.forEach(clearTimeout)
  }, [showGraph, graphData.nodes.length])

  // Determine which nodes are visible based on cascade phase
  const getNodeOpacity = useCallback((node) => {
    if (cascadePhase === 0) return 0
    if (cascadePhase === 4) return 1 // All visible

    // BFS-based reveal
    if (node.type === 'victim') {
      return cascadePhase >= 1 ? 1 : 0
    }
    
    if (node.mule_level === 1 || (node.type === 'mule' && !node.mule_level)) {
      return cascadePhase >= 2 ? 1 : 0
    }

    // Hop 2: merchants and secondary mules
    return cascadePhase >= 3 ? 1 : 0
  }, [cascadePhase])

  // Custom node renderer with opacity control
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const opacity = getNodeOpacity(node)
    if (opacity === 0) return

    ctx.globalAlpha = opacity
    const isSelected = selectedNode?.id === node.id
    const isNetworkContained = appState === APP_STATES.CONTAINED

    drawNode(node, ctx, globalScale, frozenNodes, isSelected, null, isNetworkContained)
    ctx.globalAlpha = 1
  }, [frozenNodes, selectedNode, appState, getNodeOpacity])

  // Handle node click - only in investigation states
  const handleNodeClick = useCallback((node) => {
    if (
      cascadePhase === 4 && // Only after cascade completes
      (appState === APP_STATES.INVESTIGATING ||
        appState === APP_STATES.CONTAINED ||
        appState === APP_STATES.AUDIT_LOGGED)
    ) {
      selectNode(node)

      // Center on clicked node
      if (graphRef.current) {
        graphRef.current.centerAt(node.x, node.y, 300)
        graphRef.current.zoom(2.5, 300)
      }
    }
  }, [selectNode, appState, cascadePhase])

  // Link color
  const linkColor = useCallback((link) => {
    return getLinkColor(link, frozenNodes)
  }, [frozenNodes])

  // Particles flow during cascade and investigation (stop when contained)
  const showParticles = (
    cascadePhase >= 2 && // Start particles at hop 1
    cascadePhase <= 4 &&
    appState !== APP_STATES.CONTAINED &&
    frozenNodes.length === 0
  )

  // Memoize graph data
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
      <AnimatePresence mode="wait">
        {!showGraph && (
          <motion.div
            key="radar-grid-state"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <RadarGrid />
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
                ctx.arc(node.x, node.y, 15, 0, 2 * Math.PI)
                ctx.fill()
              }}
              onNodeClick={handleNodeClick}
              linkColor={linkColor}
              linkWidth={(link) => getLinkWidth(link)}
              linkDistance={100}
              linkDirectionalParticles={showParticles ? 3 : 0}
              linkDirectionalParticleWidth={2}
              linkDirectionalParticleSpeed={0.008}
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

            {/* HUD Overlay */}
            <RadarHUD />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cascade Progress Indicator */}
      <AnimatePresence mode="wait">
        {showGraph && cascadePhase > 0 && cascadePhase < 4 && (
          <motion.div
            key="cascade-indicator"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none"
          >
            <div className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono font-semibold text-cyan-300">
                  BUILDING GRAPH... {Math.round((cascadePhase / 4) * 100)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Frozen Network Overlay */}
      <AnimatePresence mode="wait">
        {appState === APP_STATES.CONTAINED && (
          <motion.div
            key="frozen-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RadarCanvas
