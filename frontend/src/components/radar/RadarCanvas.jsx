import { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { motion, AnimatePresence } from 'framer-motion'
import { Play } from 'lucide-react'
import { useApp, APP_STATES } from '../../context/AppContext'
import { drawNode, getLinkColor, getLinkWidth, updatePulsePhase, drawForensicTooltip } from '../../utils/nodeRenderer'
import RadarGrid from './RadarGrid'
import RadarHUD from './RadarHUD'

const RadarCanvas = () => {
  const graphRef = useRef(null)
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const { showGraph, graphData, frozenNodes, selectNode, selectedNode, appState, activeAnalyzingNode, isForensicPlaybackActive, playbackActiveNodeId, setIsForensicPlaybackActive, setPlaybackActiveNodeId } = useApp()

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
    if (!showGraph || (!activeAnalyzingNode && !isForensicPlaybackActive)) return

    const intervalId = setInterval(() => {
      updatePulsePhase()
      // Trigger lightweight re-render by updating canvas context
      if (graphRef.current) {
        graphRef.current.tickFrame?.()
      }
    }, 50) // ~20fps for smooth animation

    return () => clearInterval(intervalId)
  }, [showGraph, activeAnalyzingNode, isForensicPlaybackActive])

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
  }, [graphData, showGraph])

  // Forensic playback sequence timer with DFS traversal
  useEffect(() => {
    if (!isForensicPlaybackActive || !showGraph) return

    const visibleNodes = graphData.nodes || []
    const visibleLinks = graphData.links || []

    if (visibleNodes.length === 0) return

    // Create a set of valid node IDs
    const nodeIdSet = new Set(visibleNodes.map(n => n.id))

    // Build adjacency list from graph edges, validating node existence
    const adjList = {}
    visibleNodes.forEach(n => {
      adjList[n.id] = []
    })

    visibleLinks.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source
      const targetId = typeof link.target === 'object' ? link.target.id : link.target

      // Only add edge if both nodes exist
      if (nodeIdSet.has(sourceId) && nodeIdSet.has(targetId)) {
        if (adjList[sourceId]) {
          adjList[sourceId].push(targetId)
        }
      }
    })

    // DFS traversal: start from victim, follow edges, backtrack
    const sequence = []
    const visited = new Set()

    const dfs = (nodeId) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)
      sequence.push(nodeId)

      // Visit connected nodes in order
      const neighbors = adjList[nodeId] || []
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          dfs(neighborId)
        }
      })
    }

    // Start DFS from victim node
    const victim = visibleNodes.find(n => n.type === 'victim')
    if (victim) {
      dfs(victim.id)
    } else if (visibleNodes.length > 0) {
      // If no victim, start from first node
      dfs(visibleNodes[0].id)
    }

    if (sequence.length === 0) return

    const timeouts = []

    // Set initial node immediately
    setPlaybackActiveNodeId(sequence[0])

    // Highlight each node in DFS order for 1.5 seconds
    sequence.forEach((nodeId, idx) => {
      if (idx === 0) return // Skip first, already set
      const delay = idx * 1500
      const timeoutId = setTimeout(() => {
        setPlaybackActiveNodeId(nodeId)
      }, delay)
      timeouts.push(timeoutId)
    })

    // Final timeout to end playback
    const finalTimeout = setTimeout(() => {
      setPlaybackActiveNodeId(null)
      setIsForensicPlaybackActive(false)
    }, sequence.length * 1500 + 3000) // 3 second pause at end

    timeouts.push(finalTimeout)

    return () => {
      timeouts.forEach(id => clearTimeout(id))
    }
  }, [isForensicPlaybackActive, graphData, showGraph, setPlaybackActiveNodeId, setIsForensicPlaybackActive])

  // Custom node renderer
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const isSelected = selectedNode?.id === node.id
    const isNetworkContained = appState === APP_STATES.CONTAINED
    const isPlaybackActive = playbackActiveNodeId === node.id

    drawNode(node, ctx, globalScale, frozenNodes, isSelected, activeAnalyzingNode, isNetworkContained, isPlaybackActive)

    // Draw forensic tooltip if this node is active in playback
    if (isPlaybackActive && isForensicPlaybackActive) {
      drawForensicTooltip(ctx, node.x, node.y, node.type, node)
    }
  }, [frozenNodes, selectedNode, activeAnalyzingNode, appState, playbackActiveNodeId, isForensicPlaybackActive])

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
  ) && frozenNodes.length === 0 && appState !== APP_STATES.CONTAINED

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
      <AnimatePresence mode="wait">
        {!showGraph && (
          <motion.div
            key="radar-grid-state"
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
      <AnimatePresence mode="wait">
        {showGraph && (
          <motion.div
            key="force-graph-state"
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
              linkDistance={80}
              linkDirectionalParticles={showParticles ? 4 : 0}
              linkDirectionalParticleWidth={2.5}
              linkDirectionalParticleSpeed={0.006}
              linkDirectionalParticleColor={() => 'rgba(239, 68, 68, 0.9)'}
              d3AlphaDecay={0.08}
              d3VelocityDecay={0.4}
              cooldownTicks={200}
              d3Force="charge"
              d3ForceConfig={{
                charge: { strength: -300, distanceMax: 300 }
              }}
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
      <AnimatePresence mode="wait">
        {appState === APP_STATES.TRACING && (
          <motion.div
            key="tracing-overlay"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none"
          >
            <div className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm font-mono font-semibold text-amber-400">
                  TRACING FUND LINEAGE...
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Frozen Overlay Effect */}
      <AnimatePresence mode="wait">
        {frozenNodes.length > 0 && (
          <motion.div
            key="frozen-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent animate-frost-shimmer" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forensic Playback Dim Overlay */}
      <AnimatePresence mode="wait">
        {isForensicPlaybackActive && (
          <motion.div
            key="forensic-dim-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none bg-black/30 z-40"
          />
        )}
      </AnimatePresence>

      {/* Forensic Traverse Button */}
      <AnimatePresence mode="wait">
        {appState === APP_STATES.INVESTIGATING && !isForensicPlaybackActive && showGraph && (
          <motion.button
            key="forensic-traverse-button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            onClick={() => setIsForensicPlaybackActive(true)}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 group"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full glass-panel-dark border border-indigo-500/40 hover:border-indigo-500/60 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20">
              <Play className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              <span className="text-sm font-mono font-semibold text-indigo-300 group-hover:text-indigo-200 transition-colors tracking-wider">
                ▶ RUN FORENSIC TRAVERSE
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RadarCanvas