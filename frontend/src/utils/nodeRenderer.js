import { NODE_DISPLAY_STATES } from '../context/AppContext'

// Node type colors
const COLORS = {
  victim: {
    fill: '#3b82f6',      // blue-500
    stroke: '#60a5fa',    // blue-400
    glow: 'rgba(59, 130, 246, 0.5)'
  },
  mule: {
    fill: '#ef4444',      // red-500
    stroke: '#f87171',    // red-400
    glow: 'rgba(239, 68, 68, 0.5)'
  },
  merchant: {
    fill: '#f59e0b',      // amber-500
    stroke: '#fbbf24',    // amber-400
    glow: 'rgba(245, 158, 11, 0.5)'
  },
  frozen: {
    fill: '#22d3ee',      // cyan-400
    stroke: '#67e8f9',    // cyan-300
    glow: 'rgba(34, 211, 238, 0.6)'
  },
  analyzing: {
    fill: '#eab308',      // yellow-500
    stroke: '#facc15',    // yellow-400
    glow: 'rgba(234, 179, 8, 0.7)'
  }
}

// Animation frame for pulsing effect
let pulsePhase = 0

export const updatePulsePhase = () => {
  pulsePhase = (pulsePhase + 0.08) % (Math.PI * 2)
}

// Draw node with custom styling based on type and display state
export const drawNode = (node, ctx, globalScale, frozenNodes = [], isSelected = false, activeAnalyzingNode = null) => {
  // Guard: skip rendering if coordinates are not valid numbers
  if (typeof node.x !== 'number' || typeof node.y !== 'number' ||
      !isFinite(node.x) || !isFinite(node.y)) {
    return
  }

  const isFrozen = frozenNodes.includes(node.id)
  const isAnalyzing = node.displayState === NODE_DISPLAY_STATES.ANALYZING || node.id === activeAnalyzingNode

  let colors
  if (isFrozen) {
    colors = COLORS.frozen
  } else if (isAnalyzing) {
    colors = COLORS.analyzing
  } else {
    colors = COLORS[node.type] || COLORS.victim
  }

  const nodeSize = 9 // Reduced for better graph centering and balance
  const fontSize = Math.max(5 / globalScale, 3) // Adjusted for smaller nodes

  ctx.save()

  // Pulsing glow effect for analyzing nodes
  if (isAnalyzing) {
    const pulseIntensity = 0.5 + Math.sin(pulsePhase) * 0.5
    ctx.shadowColor = `rgba(234, 179, 8, ${0.4 + pulseIntensity * 0.4})`
    ctx.shadowBlur = 10 + pulseIntensity * 10
  } else {
    ctx.shadowColor = colors.glow
    ctx.shadowBlur = isFrozen ? 12 : (isSelected ? 15 : 8)
  }

  // Node shape based on type
  ctx.beginPath()

  if (node.type === 'victim') {
    // Double circle for victim
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI)
  } else if (node.type === 'mule') {
    // Hexagon for mule
    drawHexagon(ctx, node.x, node.y, nodeSize)
  } else if (node.type === 'merchant') {
    // Rounded square for merchant
    drawRoundedSquare(ctx, node.x, node.y, nodeSize * 1.5, 5)
  } else {
    // Default circle
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI)
  }

  // Fill with gradient for depth
  const gradient = ctx.createRadialGradient(
    node.x - nodeSize * 0.3, node.y - nodeSize * 0.3, 0,
    node.x, node.y, nodeSize * 1.2
  )
  gradient.addColorStop(0, lightenColor(colors.fill, 30))
  gradient.addColorStop(1, colors.fill)
  ctx.fillStyle = gradient
  ctx.fill()

  // Stroke
  ctx.strokeStyle = colors.stroke
  ctx.lineWidth = isSelected ? 2.5 : (isAnalyzing ? 2 : 1.5)
  ctx.stroke()

  // Selection ring
  if (isSelected && !isFrozen) {
    ctx.beginPath()
    ctx.arc(node.x, node.y, nodeSize + 3, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Frozen effect - ice crystals
  if (isFrozen) {
    drawFrostEffect(ctx, node.x, node.y, nodeSize)
  }

  // Analyzing spinner effect
  if (isAnalyzing) {
    drawAnalyzingSpinner(ctx, node.x, node.y, nodeSize)
  }

  ctx.restore()

  // Label - Draw inside the node
  ctx.save()
  ctx.font = `600 ${fontSize}px 'JetBrains Mono', monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Label with mule level indicator
  let label = node.label || node.id
  if (node.type === 'mule' && node.mule_level) {
    const levelNames = { 1: 'PRI', 2: 'SEC', 3: 'TER' } // Shortened names
    label = levelNames[node.mule_level] || `L${node.mule_level}`
  }

  // For longer labels, abbreviate
  if (label.length > 8) {
    label = label.substring(0, 3).toUpperCase()
  }

  // Draw label text inside the node with shadow for readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
  ctx.shadowBlur = 4
  ctx.fillStyle = '#ffffff'
  ctx.fillText(label, node.x, node.y)

  ctx.restore()
}

// Draw hexagon shape
const drawHexagon = (ctx, x, y, size) => {
  const sides = 6
  const angle = (2 * Math.PI) / sides
  const rotationOffset = Math.PI / 6 // Rotate to have flat top

  ctx.moveTo(
    x + size * Math.cos(rotationOffset),
    y + size * Math.sin(rotationOffset)
  )

  for (let i = 1; i <= sides; i++) {
    ctx.lineTo(
      x + size * Math.cos(i * angle + rotationOffset),
      y + size * Math.sin(i * angle + rotationOffset)
    )
  }
}

// Draw rounded square
const drawRoundedSquare = (ctx, x, y, size, radius) => {
  const halfSize = size / 2
  roundRect(ctx, x - halfSize, y - halfSize, size, size, radius)
}

// Rounded rectangle helper
const roundRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.arcTo(x + width, y, x + width, y + radius, radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
  ctx.lineTo(x + radius, y + height)
  ctx.arcTo(x, y + height, x, y + height - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
}

// Draw frost effect on frozen nodes
const drawFrostEffect = (ctx, x, y, size) => {
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 1

  // Draw ice crystal lines
  const crystalCount = 6
  const angle = (2 * Math.PI) / crystalCount

  for (let i = 0; i < crystalCount; i++) {
    const startX = x + Math.cos(i * angle) * (size - 2)
    const startY = y + Math.sin(i * angle) * (size - 2)
    const endX = x + Math.cos(i * angle) * (size + 5)
    const endY = y + Math.sin(i * angle) * (size + 5)

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()

    // Small branches
    const midX = x + Math.cos(i * angle) * (size + 2)
    const midY = y + Math.sin(i * angle) * (size + 2)
    const branchAngle = 0.4
    const branchLen = 2.5

    ctx.beginPath()
    ctx.moveTo(midX, midY)
    ctx.lineTo(
      midX + Math.cos(i * angle + branchAngle) * branchLen,
      midY + Math.sin(i * angle + branchAngle) * branchLen
    )
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(midX, midY)
    ctx.lineTo(
      midX + Math.cos(i * angle - branchAngle) * branchLen,
      midY + Math.sin(i * angle - branchAngle) * branchLen
    )
    ctx.stroke()
  }

  ctx.restore()
}

// Draw analyzing spinner effect
const drawAnalyzingSpinner = (ctx, x, y, size) => {
  ctx.save()

  const spinnerRadius = size + 4
  const arcLength = 0.6

  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'

  // Rotating arc
  ctx.beginPath()
  ctx.arc(x, y, spinnerRadius, pulsePhase, pulsePhase + arcLength)
  ctx.stroke()

  // Second arc for balance
  ctx.beginPath()
  ctx.arc(x, y, spinnerRadius, pulsePhase + Math.PI, pulsePhase + Math.PI + arcLength)
  ctx.stroke()

  ctx.restore()
}

// Lighten a hex color
const lightenColor = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, (num >> 16) + amt)
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt)
  const B = Math.min(255, (num & 0x0000FF) + amt)
  return `rgb(${R}, ${G}, ${B})`
}

// Get node area for click detection
export const getNodeArea = () => {
  return 18 // Larger area for easier clicking
}

// Link styling
export const getLinkColor = (link, frozenNodes = []) => {
  const sourceId = typeof link.source === 'object' ? link.source.id : link.source
  const targetId = typeof link.target === 'object' ? link.target.id : link.target

  if (frozenNodes.includes(sourceId) || frozenNodes.includes(targetId)) {
    return 'rgba(34, 211, 238, 0.5)' // Cyan for frozen
  }
  return 'rgba(239, 68, 68, 0.5)' // Red for active
}

export const getLinkWidth = (link) => {
  const value = link.value || 50000
  // Increased base thickness - range from 2 to 5
  return Math.max(2, Math.min(5, value / 40000))
}