/**
 * Data Validation Utilities
 * Industry-standard approach to prevent duplicate key errors
 * 
 * @module dataValidation
 */

/**
 * Validates that all items in an array have unique, non-empty IDs
 * @param {Array} items - Array of objects to validate
 * @param {string} idField - Name of the ID field (default: 'id')
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateUniqueIds(items, idField = 'id') {
  const errors = []
  
  if (!Array.isArray(items)) {
    errors.push('Input must be an array')
    return { isValid: false, errors }
  }

  const seenIds = new Set()
  
  items.forEach((item, index) => {
    const id = item?.[idField]
    
    // Check for missing or empty ID
    if (!id || id === '') {
      errors.push(`Item at index ${index} has missing or empty ${idField}`)
    }
    
    // Check for duplicate ID
    if (seenIds.has(id)) {
      errors.push(`Duplicate ${idField} found: "${id}" at index ${index}`)
    }
    
    seenIds.add(id)
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Filters array to only include items with valid IDs
 * @param {Array} items - Array to filter
 * @param {string} idField - Name of the ID field (default: 'id')
 * @returns {Array} Filtered array with only valid items
 */
export function filterValidItems(items, idField = 'id') {
  if (!Array.isArray(items)) return []
  
  return items.filter(item => {
    const id = item?.[idField]
    return id && id !== ''
  })
}

/**
 * Generates a composite key for React list rendering
 * @param {Object} item - Item object
 * @param {number} index - Array index
 * @param {string} prefix - Key prefix for namespacing
 * @returns {string} Composite key
 */
export function generateCompositeKey(item, index, prefix = 'item') {
  const id = item?.id || item?.utr || item?.account_number
  const timestamp = item?.timestamp || Date.now()
  
  if (id) {
    return `${prefix}-${id}`
  }
  
  // Fallback: use index + timestamp + random
  return `${prefix}-${index}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validates graph data structure for react-force-graph
 * @param {Object} graphData - Graph data with nodes and links
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateGraphData(graphData) {
  const errors = []
  
  if (!graphData || typeof graphData !== 'object') {
    errors.push('Graph data must be an object')
    return { isValid: false, errors }
  }
  
  const { nodes = [], links = [] } = graphData
  
  // Validate nodes
  const nodeValidation = validateUniqueIds(nodes, 'id')
  if (!nodeValidation.isValid) {
    errors.push(...nodeValidation.errors.map(e => `Nodes: ${e}`))
  }
  
  // Build node ID set for link validation
  const nodeIds = new Set(nodes.map(n => n?.id).filter(Boolean))
  
  // Validate links
  links.forEach((link, index) => {
    const sourceId = typeof link.source === 'object' ? link.source?.id : link.source
    const targetId = typeof link.target === 'object' ? link.target?.id : link.target
    
    if (!sourceId) {
      errors.push(`Link at index ${index} has missing source`)
    } else if (!nodeIds.has(sourceId)) {
      errors.push(`Link at index ${index} references non-existent source node: "${sourceId}"`)
    }
    
    if (!targetId) {
      errors.push(`Link at index ${index} has missing target`)
    } else if (!nodeIds.has(targetId)) {
      errors.push(`Link at index ${index} references non-existent target node: "${targetId}"`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Sanitizes graph data by removing invalid links
 * @param {Object} graphData - Graph data with nodes and links
 * @returns {Object} Sanitized graph data
 */
export function sanitizeGraphData(graphData) {
  if (!graphData) return { nodes: [], links: [] }
  
  const nodes = filterValidItems(graphData.nodes || [], 'id')
  const nodeIds = new Set(nodes.map(n => n.id))
  
  const links = (graphData.links || []).filter(link => {
    const sourceId = typeof link.source === 'object' ? link.source?.id : link.source
    const targetId = typeof link.target === 'object' ? link.target?.id : link.target
    
    return sourceId && targetId && nodeIds.has(sourceId) && nodeIds.has(targetId)
  })
  
  return { nodes, links }
}
