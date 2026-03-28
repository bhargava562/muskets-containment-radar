/**
 * Enterprise Node Renderer - Professional Forensic Visualization
 * Stripped of game-like elements, optimized for rapid data analysis
 */

// Professional color palette - muted, high-contrast
const COLORS = {
  victim: {
    fill: '#2563eb',      // Professional blue
    stroke: '#3b82f6',
    glow: 'rgba(37, 99, 235, 0.4)'
  },
  mule: {
    fill: '#dc2626',      // Sharp red
    stroke: '#ef4444',
    glow: 'rgba(220, 38, 38, 0.4)'
  },
  merchant: {
    fill: '#d97706',      // Amber
    stroke: '#f59e0b',
    glow: 'rgba(217, 119, 6, 0.4)'
  },
  frozen: {
    fill: '#0ea5e9',      // Ice blue
    stroke: '#38bdf8',
    glow: 'rgba(14, 165, 233, 0.5)'
  },
  contained_merchant: {
    fill: '#059669',      // Emerald green
    stroke: '#10b981',
    glow: 'rgba(5, 150, 105, 0.5)'
  }
}

/**
 * Draw node - Clean, geometric, text-minimal
 */
export const drawNode = (node, ctx, globalScale, frozenNodes = [], isSelected = false, activeAnalyzingNode = null, isNetworkContained = false) => {
  if (typeof node.x !== 'number' || typeof node.y !== 'number' ||
      !isFinite(node.x) || !isFinite(node.y)) {
    return
  }

  const isFrozen = frozenNodes.includes(node.id) || isNetworkContained
  
  // Determine colors
  let colors
  if (isFrozen) {
    colors = node.type === 'merchant' ? COLORS.contained_merchant : COLORS.frozen
  } else {
    colors = COLORS[node.type] || COLORS.victim
  }

  const nodeSize = 10
  const fontSize = Math.max(6 / globalScale, 4)

  ctx.save()

  // Subtle glow - no pulsing
  ctx.shadowColor = colors.glow
  ctx.shadowBlur = isSelected ? 16 : 6

  // Draw shape based on type
  ctx.beginPath()

  if (node.type === 'victim') {
    // Clean circle
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI)
  } else if (node.type === 'mule') {
    // Sharp hexagon
    drawHexagon(ctx, node.x, node.y, nodeSize)
  } else if (node.type === 'merchant') {
    // Rounded square
    drawRoundedSquare(ctx, node.x, node.y, nodeSize * 1.4, 3)
  }

  // Solid fill - no gradients
  ctx.fillStyle = colors.fill
  ctx.fill()

  // Crisp stroke
  ctx.strokeStyle = colors.stroke
  ctx.lineWidth = isSelected ? 3 : 1.5
  ctx.stroke()

  // Selection indicator - bright white border
  if (isSelected) {
    ctx.beginPath()
    if (node.type === 'victim') {
      ctx.arc(node.x, node.y, nodeSize + 4, 0, 2 * Math.PI)
    } else if (node.type === 'mule') {
      drawHexagon(ctx, node.x, node.y, nodeSize + 4)
    } else if (node.type === 'merchant') {
      drawRoundedSquare(ctx, node.x, node.y, (nodeSize * 1.4) + 4, 3)
    }
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)'
    ctx.shadowBlur = 8
    ctx.stroke()
  }

  // Frozen indicator - simple ice crystal overlay
  if (isFrozen && node.type === 'mule') {
    drawMinimalFrostEffect(ctx, node.x, node.y, nodeSize)
  }

  // Merchant lock icon - minimal
  if (isFrozen && node.type === 'merchant') {
    drawMinimalLockIcon(ctx, node.x, node.y, nodeSize)
  }

  ctx.restore()

  // Label - ONLY node ID, no extra text
  ctx.save()
  ctx.font = `600 ${fontSize}px 'Inter', sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  let label = node.label || node.id
  
  // Abbreviate long labels
  if (label.length > 6) {
    label = label.substring(0, 6)
  }

  // Text with subtle shadow for readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
  ctx.shadowBlur = 3
  ctx.fillStyle = '#ffffff'
  ctx.fillText(label, node.x, node.y)

  ctx.restore()
}

// Hexagon shape
const drawHexagon = (ctx, x, y, size) => {
  const sides = 6
  const angle = (2 * Math.PI) / sides
  const rotationOffset = Math.PI / 6

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

// Rounded square
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

// Minimal frost effect - 4 simple lines
const drawMinimalFrostEffect = (ctx, x, y, size) => {
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.lineWidth = 1.5

  const crystalCount = 4
  const angle = (2 * Math.PI) / crystalCount

  for (let i = 0; i < crystalCount; i++) {
    const endX = x + Math.cos(i * angle) * (size + 4)
    const endY = y + Math.sin(i * angle) * (size + 4)

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(endX, endY)
    ctx.stroke()
  }

  ctx.restore()
}

// Minimal lock icon - simple padlock shape
const drawMinimalLockIcon = (ctx, x, y, size) => {
  ctx.save()

  const lockSize = size * 0.6
  
  // Lock shackle (arc)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(x, y - lockSize * 0.3, lockSize * 0.5, Math.PI, 2 * Math.PI)
  ctx.stroke()

  // Lock body (small rectangle)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.fillRect(x - lockSize * 0.5, y - lockSize * 0.2, lockSize, lockSize * 0.8)

  ctx.restore()
}

// Link styling - subtle, dark
export const getLinkColor = (link, frozenNodes = []) => {
  const sourceId = typeof link.source === 'object' ? link.source.id : link.source
  const targetId = typeof link.target === 'object' ? link.target.id : link.target

  if (frozenNodes.includes(sourceId) || frozenNodes.includes(targetId)) {
    return 'rgba(14, 165, 233, 0.3)' // Muted cyan for frozen
  }
  return 'rgba(255, 255, 255, 0.15)' // Very subtle white for active
}

export const getLinkWidth = (link) => {
  const value = link.value || 50000
  return Math.max(1.5, Math.min(4, value / 50000))
}

// No-op for compatibility
export const updatePulsePhase = () => {}
export const drawForensicTooltip = () => {}
export const getNodeArea = () => 20
