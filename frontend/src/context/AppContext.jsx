import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import iobData from '../data/iob_mock_data.json'
import { validateGraphData, sanitizeGraphData } from '../utils/dataValidation'

const AppContext = createContext(null)

export const APP_STATES = {
  MONITORING: 'MONITORING',
  THREAT_DETECTED: 'THREAT_DETECTED',
  TRACING: 'TRACING',
  INVESTIGATING: 'INVESTIGATING',
  CONTAINED: 'CONTAINED',
  AUDIT_LOGGED: 'AUDIT_LOGGED'
}

export const NODE_DISPLAY_STATES = {
  HIDDEN: 'hidden',
  ANALYZING: 'analyzing',
  CONFIRMED: 'confirmed'
}

// Get graph structure by ID
const getGraphStructure = (structureId) => {
  const structure = iobData.graph_structures[structureId]
  if (!structure) {
    return { nodes: [], links: [] }
  }

  const graphNodes = structure.nodes.map(node => ({
    ...node,
    displayState: node.reveal_order === 1 ? NODE_DISPLAY_STATES.CONFIRMED : NODE_DISPLAY_STATES.HIDDEN
  }))

  const graphLinks = structure.links.map(link => ({
    ...link,
    isRevealed: false
  }))

  // Validate graph data integrity
  const validation = validateGraphData({ nodes: graphNodes, links: graphLinks })
  if (!validation.isValid) {
    console.error('[MUSKETS] Graph data validation failed:', validation.errors)
    // Sanitize to prevent runtime errors
    const sanitized = sanitizeGraphData({ nodes: graphNodes, links: graphLinks })
    return { graphNodes: sanitized.nodes, graphLinks: sanitized.links, maxRevealOrder: Math.max(...sanitized.nodes.map(n => n.reveal_order)) }
  }

  return { graphNodes, graphLinks, maxRevealOrder: Math.max(...structure.nodes.map(n => n.reveal_order)) }
}

// Transform normal transactions
const getNormalTransactions = () => {
  return iobData.transactions.normal_feed.map((txn, idx) => ({
    id: txn.id || `TXN-INIT-${idx}-${Date.now()}`,
    utr: txn.utr_number,
    txnType: txn.txn_type,
    amount: txn.amount,
    merchant: txn.merchant,
    mccCode: txn.mcc_code,
    mccDescription: txn.mcc_description,
    timestamp: txn.timestamp,
    status: txn.status,
    location: txn.location,
    aiAnalysis: txn.ai_analysis,
    isCritical: false
  }))
}

export function AppProvider({ children }) {
  const [appState, setAppState] = useState(APP_STATES.MONITORING)
  const [selectedNode, setSelectedNode] = useState(null)
  const [frozenNodes, setFrozenNodes] = useState([])
  const [showGraph, setShowGraph] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [threatAlert, setThreatAlert] = useState(null)
  const [auditHash, setAuditHash] = useState(null)
  const [containedNode, setContainedNode] = useState(null)
  const [caseMetadata, setCaseMetadata] = useState(iobData.case_metadata)

  // DS Visualizer state
  const [graphNodes, setGraphNodes] = useState([])
  const [graphLinks, setGraphLinks] = useState([])
  const [currentRevealStep, setCurrentRevealStep] = useState(0)
  const [activeAnalyzingNode, setActiveAnalyzingNode] = useState(null)
  const [revealedLinks, setRevealedLinks] = useState([])

  // Forensic Playback state
  const [isForensicPlaybackActive, setIsForensicPlaybackActive] = useState(false)
  const [playbackActiveNodeId, setPlaybackActiveNodeId] = useState(null)

  // Transaction streaming state
  const [criticalAlertQueued, setCriticalAlertQueued] = useState(false)
  const [alertTypeIndex, setAlertTypeIndex] = useState(0)
  const transactionStreamRef = useRef(null)
  const animationTimeoutRef = useRef(null)
  const runVisualizerStepRef = useRef(null)

  const normalTxnPool = useRef(getNormalTransactions())
  const transactionIndexRef = useRef(0)

  // Initialize with first transaction
  useEffect(() => {
    if (transactions.length === 0 && normalTxnPool.current.length > 0) {
      const firstTxn = normalTxnPool.current[0]
      if (firstTxn && firstTxn.id) {
        setTransactions([{ ...firstTxn, timestamp: new Date().toISOString() }])
        transactionIndexRef.current = 1
      } else {
        console.error('[MUSKETS] Invalid transaction data - missing ID:', firstTxn)
      }
    }
  }, [transactions.length])

  // Transaction streaming every 10 seconds
  useEffect(() => {
    if (appState !== APP_STATES.MONITORING) {
      if (transactionStreamRef.current) {
        clearInterval(transactionStreamRef.current)
      }
      return
    }

    transactionStreamRef.current = setInterval(() => {
      const prevIndex = transactionIndexRef.current
      const pool = normalTxnPool.current
      const nextIndex = prevIndex % pool.length

        // Transaction sequence: 2 good -> 1st critical -> 2 good -> 2nd critical -> 3 good -> 3rd critical
        // Index:                 0,1    -> 2              -> 3,4    -> 5              -> 6,7,8    -> 9
        const shouldShowCritical =
          (prevIndex === 2 && alertTypeIndex === 0) ||  // After 2 transactions, show 1st critical
          (prevIndex === 5 && alertTypeIndex === 1) ||  // After 2 more (total 5), show 2nd critical
          (prevIndex === 9 && alertTypeIndex === 2)      // After 3 more (total 9), show 3rd critical

        if (shouldShowCritical && !criticalAlertQueued) {
          setCriticalAlertQueued(true)
          // Trigger threat detection after a short delay
          setTimeout(() => {
            // Cycle through different alert types
            const alerts = iobData.transactions.critical_alerts
            const alertIndex = alertTypeIndex % alerts.length
            const alertData = alerts[alertIndex]

            const alert = {
              id: alertData.id,
              alertType: alertData.alert_type,
              severity: alertData.severity,
              riskScore: alertData.risk_score,
              timestamp: new Date().toISOString(),
              sourceAccount: alertData.source_account,
              totalAmount: alertData.total_amount,
              fragmentationCount: alertData.fragmentation_count,
              timeWindowSeconds: alertData.time_window_seconds,
              description: alertData.description,
              triggerRules: alertData.trigger_rules,
              outboundTransactions: alertData.outbound_transactions,
              graphStructureId: alertData.graph_structure_id
            }

            setThreatAlert(alert)
            setAppState(APP_STATES.THREAT_DETECTED)
            setAlertTypeIndex(prev => prev + 1)

            // Update case metadata based on alert type
            setCaseMetadata(prev => ({
              ...prev,
              investigation_type: alert.alertType,
              total_suspected_amount: alert.totalAmount
            }))
          }, 2000)
        }

      // Add next safe transaction
      const nextTxn = {
        ...pool[nextIndex],
        id: `TXN-IOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      }

      // Validate transaction has required fields
      if (!nextTxn.id || nextTxn.id === '') {
        console.error('[MUSKETS] Generated transaction with empty ID:', nextTxn)
        return
      }

      setTransactions(prev => [nextTxn, ...prev.slice(0, 7)])

      transactionIndexRef.current = prevIndex + 1
    }, 6000) // Changed from 10000 to 6000 (6 seconds)

    return () => {
      if (transactionStreamRef.current) {
        clearInterval(transactionStreamRef.current)
      }
    }
  }, [appState, criticalAlertQueued, alertTypeIndex])

  // Auto-transition from CONTAINED to AUDIT_LOGGED after 2 seconds
  useEffect(() => {
    if (appState === APP_STATES.CONTAINED) {
      const timer = setTimeout(() => {
        const chars = '0123456789abcdef'
        let hash = ''
        for (let i = 0; i < 64; i++) {
          hash += chars[Math.floor(Math.random() * chars.length)]
        }
        setAuditHash(hash)
        setAppState(APP_STATES.AUDIT_LOGGED)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [appState])

  // DS Visualizer: Sequential node revelation animation
  const runVisualizerStep = useCallback((step, nodes, links, maxOrder) => {
    if (step > maxOrder) {
      // All nodes revealed, transition to investigating
      setAppState(APP_STATES.INVESTIGATING)
      return
    }

    const nodeToReveal = nodes.find(n => n.reveal_order === step)
    const linkToReveal = links.find(l => l.reveal_order === step - 1)

    if (nodeToReveal && step > 1) {
      // First show analyzing state
      setActiveAnalyzingNode(nodeToReveal.id)
      setGraphNodes(prev => prev.map(n =>
        n.id === nodeToReveal.id
          ? { ...n, displayState: NODE_DISPLAY_STATES.ANALYZING }
          : n
      ))

      // After 600ms, confirm the node
      animationTimeoutRef.current = setTimeout(() => {
        setGraphNodes(prev => prev.map(n =>
          n.id === nodeToReveal.id
            ? { ...n, displayState: NODE_DISPLAY_STATES.CONFIRMED }
            : n
        ))
        setActiveAnalyzingNode(null)

        // Auto-select the node being revealed for sidebar display
        const confirmedNode = nodes.find(n => n.id === nodeToReveal.id)
        if (confirmedNode) {
          setSelectedNode({ ...confirmedNode, displayState: NODE_DISPLAY_STATES.CONFIRMED })
        }

        // Reveal the link
        if (linkToReveal) {
          setRevealedLinks(prev => [...prev, linkToReveal.reveal_order])
        }

        // Continue to next step after delay
        animationTimeoutRef.current = setTimeout(() => {
          setCurrentRevealStep(step + 1)
          if (runVisualizerStepRef.current) {
            runVisualizerStepRef.current(step + 1, nodes, links, maxOrder)
          }
        }, 800)
      }, 600)
    } else if (step === 1) {
      // First node (victim) is already confirmed, reveal first set of links
      const initialLinks = links.filter(l => l.reveal_order <= 2).map(l => l.reveal_order)
      setRevealedLinks(initialLinks)
      animationTimeoutRef.current = setTimeout(() => {
        setCurrentRevealStep(2)
        if (runVisualizerStepRef.current) {
          runVisualizerStepRef.current(2, nodes, links, maxOrder)
        }
      }, 800)
    }
  }, [])

  // Store the function in ref using useEffect
  useEffect(() => {
    runVisualizerStepRef.current = runVisualizerStep
  }, [runVisualizerStep])

  const initializeTrace = useCallback(() => {
    if (!threatAlert) return

    // Get the appropriate graph structure based on the alert type
    const structureId = threatAlert.graphStructureId || 'fragmentation_network'
    const { graphNodes: nodes, graphLinks: links, maxRevealOrder: maxOrder } = getGraphStructure(structureId)

    // Initialize graph with only victim visible
    setGraphNodes(nodes.map(n => ({
      ...n,
      displayState: n.reveal_order === 1 ? NODE_DISPLAY_STATES.CONFIRMED : NODE_DISPLAY_STATES.HIDDEN
    })))
    setGraphLinks(links)
    setRevealedLinks([])
    setCurrentRevealStep(1)
    setShowGraph(true)
    setAppState(APP_STATES.TRACING)

    // Start the DS visualization animation
    setTimeout(() => {
      runVisualizerStep(1, nodes, links, maxOrder)
    }, 500)
  }, [threatAlert, runVisualizerStep])

  const selectNode = useCallback((node) => {
    // Find the full node data from graphNodes
    const graphNode = graphNodes.find(n => n.id === node.id)
    if (graphNode && graphNode.displayState === NODE_DISPLAY_STATES.CONFIRMED) {
      setSelectedNode(graphNode)
    }
  }, [graphNodes])

  const freezeNode = useCallback((nodeId, nodeData) => {
    setFrozenNodes(prev => [...prev, nodeId])
    setContainedNode(nodeData)
    setAppState(APP_STATES.CONTAINED)
  }, [])

  const deployNetworkContainment = useCallback(() => {
    // Freeze ALL nodes in the current visible graph (not hidden)
    const visibleNodes = graphNodes.filter(n => n.displayState !== NODE_DISPLAY_STATES.HIDDEN)
    const allNodeIds = visibleNodes.map(n => n.id)
    setFrozenNodes(allNodeIds)
    setContainedNode(null) // No single node focus - entire network is contained
    setAppState(APP_STATES.CONTAINED)
  }, [graphNodes])

  const resetInvestigation = useCallback(() => {
    // Clear any pending animations
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }

    // Return to monitoring state
    setAppState(APP_STATES.MONITORING)
    setSelectedNode(null)
    setFrozenNodes([])
    setShowGraph(false)
    setThreatAlert(null)
    setAuditHash(null)
    setContainedNode(null)
    setGraphNodes([])
    setGraphLinks([])
    setCurrentRevealStep(0)
    setActiveAnalyzingNode(null)
    setRevealedLinks([])
    setCriticalAlertQueued(false)
    setCaseMetadata(iobData.case_metadata)

    // DO NOT reset alertTypeIndex or transactionIndexRef - let sequence continue
  }, [])

  const closePanel = useCallback(() => {
    setSelectedNode(null)
  }, [])

  // Build visible graph data for rendering
  const visibleGraphData = {
    nodes: graphNodes.filter(n => n.displayState !== NODE_DISPLAY_STATES.HIDDEN),
    links: graphLinks.filter(l => {
      if (!revealedLinks.includes(l.reveal_order)) return false
      
      // Only include links where BOTH source and target nodes are visible
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source
      const targetId = typeof l.target === 'object' ? l.target.id : l.target
      
      const sourceVisible = graphNodes.some(n => 
        n.id === sourceId && n.displayState !== NODE_DISPLAY_STATES.HIDDEN
      )
      const targetVisible = graphNodes.some(n => 
        n.id === targetId && n.displayState !== NODE_DISPLAY_STATES.HIDDEN
      )
      
      return sourceVisible && targetVisible
    })
  }

  const value = {
    // State
    appState,
    selectedNode,
    frozenNodes,
    showGraph,
    transactions,
    threatAlert,
    graphData: visibleGraphData,
    graphNodes,
    auditHash,
    containedNode,
    caseMetadata,
    activeAnalyzingNode,
    currentRevealStep,
    isForensicPlaybackActive,
    playbackActiveNodeId,

    // Actions
    initializeTrace,
    selectNode,
    freezeNode,
    deployNetworkContainment,
    resetInvestigation,
    closePanel,
    setSelectedNode,
    setIsForensicPlaybackActive,
    setPlaybackActiveNodeId
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export default AppContext