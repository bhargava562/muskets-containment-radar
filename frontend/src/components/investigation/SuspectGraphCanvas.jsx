import { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, HelpCircle, ZoomIn } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'
import ExpandPreviewPanel from './ExpandPreviewPanel'

// Color map based on node type
const NODE_COLORS = {
  VICTIM: { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.25)', label: 'Victim' },
  MULE: { fill: '#ef4444', glow: 'rgba(239, 68, 68, 0.25)', label: 'Suspected Mule' },
  MERCHANT: { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.25)', label: 'Merchant Escrow' },
  UNKNOWN: { fill: '#64748b', glow: 'rgba(100, 116, 139, 0.2)', label: 'Unclassified' }
}

const VERDICT_COLORS = {
  CONFIRMED: '#10b981',
  DISPUTED: '#ef4444',
  CLEARED: '#06b6d4',
  NEEDS_MORE_EVIDENCE: '#f59e0b',
  UNREVIEWED: 'rgba(255, 255, 255, 0.15)'
}

export default function SuspectGraphCanvas() {
  const graphRef = useRef(null)
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [showPreview, setShowPreview] = useState(false)
  const { context, selectedNodeId, setSelectedNodeId } = useInvestigation()

  // Sizing observer
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

  // Auto zoom
  useEffect(() => {
    if (graphRef.current && context?.nodes?.length > 0) {
      setTimeout(() => {
        graphRef.current.zoomToFit(450, 80)
      }, 300)
    }
  }, [context, showPreview])

  // Process nodes & edges, including pre-computed preview hops if enabled
  const memoizedGraphData = useMemo(() => {
    if (!context) return { nodes: [], links: [] }

    // Core nodes
    const nodes = (context.nodes || []).map(n => ({
      id: n.nodeId,
      label: n.label,
      type: n.nodeType,
      verdict: n.officerVerdict,
      action: n.nodeAction,
      isPreview: false
    }))

    // Core links
    const links = (context.edges || []).map(e => ({
      source: e.fromNodeId,
      target: e.toNodeId,
      amount: e.amount,
      type: e.type,
      isPreview: false
    }))

    // If preview enabled and selected node has pre-computed preview hops
    if (showPreview && context.expandPreview && selectedNodeId === 'M2') {
      const previewNodes = (context.expandPreview.nodes || []).map(n => ({
        id: n.nodeId,
        label: n.label,
        type: n.nodeType,
        verdict: n.officerVerdict,
        action: n.nodeAction,
        isPreview: true
      }))

      const previewLinks = (context.expandPreview.edges || []).map(e => ({
        source: e.fromNodeId,
        target: e.toNodeId,
        amount: e.amount,
        type: e.type,
        isPreview: true
      }))

      nodes.push(...previewNodes)
      links.push(...previewLinks)
    }

    return { nodes, links }
  }, [context, showPreview, selectedNodeId])

  // Custom node renderer
  const drawNode = useCallback((node, ctx, globalScale) => {
    const isSelected = selectedNodeId === node.id
    const isPreview = node.isPreview
    const config = NODE_COLORS[node.type] || NODE_COLORS.UNKNOWN
    
    const size = isSelected ? 9.5 : 7.5
    const fontSize = Math.max(10 / globalScale, 4.5)

    // Semi-translucent for preview hops
    ctx.globalAlpha = isPreview ? 0.45 : 1.0

    // Drop Shadow Glow (only for suspects/selected)
    if (node.type === 'MULE' || isSelected) {
      ctx.shadowColor = config.glow
      ctx.shadowBlur = 18
    }

    // Outer ring for verdict status
    ctx.strokeStyle = VERDICT_COLORS[node.verdict] || VERDICT_COLORS.UNREVIEWED
    ctx.lineWidth = isPreview ? 1.5 : 2.2
    if (isPreview) {
      ctx.setLineDash([2.5, 2.5]) // Dotted border for previews
    } else {
      ctx.setLineDash([])
    }
    ctx.beginPath()
    ctx.arc(node.x, node.y, size + 2.5, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.setLineDash([]) // Reset dash

    // Inner Solid Circle
    ctx.fillStyle = config.fill
    ctx.beginPath()
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)
    ctx.fill()

    // Reset shadow
    ctx.shadowBlur = 0

    // White selection highlight inside
    if (isSelected) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(node.x, node.y, size - 2.5, 0, 2 * Math.PI)
      ctx.stroke()
    }

    // Node Label text
    if (globalScale > 0.45) {
      ctx.font = `${isSelected ? '700' : '500'} ${fontSize}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = isPreview ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)'
      ctx.fillText(node.label || '', node.x, node.y + size + 6)
    }

    ctx.globalAlpha = 1.0
  }, [selectedNodeId])

  // Custom link renderer (dashed for preview hops)
  const drawLink = useCallback((link, ctx) => {
    ctx.strokeStyle = link.isPreview ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.35)'
    ctx.lineWidth = link.isPreview ? 1 : 2
    if (link.isPreview) {
      ctx.setLineDash([4, 4])
    } else {
      ctx.setLineDash([])
    }
    ctx.beginPath()
    ctx.moveTo(link.source.x, link.source.y)
    ctx.lineTo(link.target.x, link.target.y)
    ctx.stroke()
    ctx.setLineDash([]) // Reset
  }, [])

  const hasExpandableHop = useMemo(() => {
    return context?.investigationCoverage?.expandableNodeIds?.includes(selectedNodeId)
  }, [context, selectedNodeId])

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden relative bg-slate-950/60 border border-slate-900 rounded-2xl">
      {/* Grid Pattern Background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none">
        <defs>
          <pattern id="graph-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#graph-grid)" />
      </svg>

      {/* Main Canvas Component */}
      {memoizedGraphData.nodes.length > 0 ? (
        <ForceGraph2D
          ref={graphRef}
          graphData={memoizedGraphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="transparent"
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={(node, color, ctx) => {
            if (typeof node.x !== 'number' || typeof node.y !== 'number') return
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(node.x, node.y, 16, 0, 2 * Math.PI)
            ctx.fill()
          }}
          onNodeClick={(node) => {
            setSelectedNodeId(node.id)
            if (node.id !== 'M2') {
              setShowPreview(false) // Reset preview toggle if selecting other node
            }
          }}
          linkColor={() => 'transparent'} // drawn manually
          linkCanvasObjectMode={() => 'before'}
          linkCanvasObject={drawLink}
          linkDirectionalParticles={showPreview ? 1 : 3}
          linkDirectionalParticleWidth={(l) => l.isPreview ? 1.5 : 2.5}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleColor={(l) => l.isPreview ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.7)'}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={0.85}
          linkDirectionalArrowColor={() => 'rgba(239, 68, 68, 0.4)'}
          cooldownTicks={120}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          minZoom={0.25}
          maxZoom={5}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-slate-700 font-mono text-xs">
          Loading suspect graph...
        </div>
      )}

      {/* Expand Preview Interface */}
      {hasExpandableHop && (
        <ExpandPreviewPanel 
          showPreview={showPreview} 
          setShowPreview={setShowPreview} 
        />
      )}

      {/* Verdict Color Legends */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 p-3.5 rounded-xl bg-slate-900/80 backdrop-blur border border-slate-800/60 max-w-[280px]">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">NODE VERDICT STATUS</span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: VERDICT_COLORS.CONFIRMED }} />
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: VERDICT_COLORS.DISPUTED }} />
            <span>Disputed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: VERDICT_COLORS.CLEARED }} />
            <span>Cleared</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: VERDICT_COLORS.NEEDS_MORE_EVIDENCE }} />
            <span>Needs Evidence</span>
          </div>
        </div>
      </div>
    </div>
  )
}
