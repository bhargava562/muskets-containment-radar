import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useApp } from './AppContextSimplified'

const InvestigationContext = createContext(null)

export function InvestigationProvider({ children }) {
  const { markUnderInvestigation, approveContainment, markFalsePositive } = useApp() || {}
  
  const [activeCaseId, setActiveCaseId] = useState(null)
  const [caseSnapshot, setCaseSnapshot] = useState(null) // metadata before graph build
  const [context, setContext] = useState(null)          // canonical context containing nodes/edges
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

  // Load snapshot when case is selected from the queue
  const startInvestigation = useCallback(async (caseId) => {
    setLoading(true)
    setError(null)
    setContext(null)
    setSelectedNodeId(null)
    try {
      const res = await fetch(`${backendUrl}/api/investigation/${caseId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) throw new Error('Failed to initiate case snapshot.')
      const data = await res.json()
      setCaseSnapshot(data)
      setActiveCaseId(caseId)
      // Check if case is already active and graph was built
      if (data.status !== 'PENDING_TRIAGE') {
        // Fetch full context directly
        await refreshContext(caseId)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [backendUrl])

  // Confirms the snapshot and builds the graph
  const buildGraph = useCallback(async () => {
    if (!activeCaseId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${backendUrl}/api/investigation/${activeCaseId}/build-graph`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Failed to build suspect graph.')
      const data = await res.json()
      setContext(data)
      // Auto-select first node if available
      if (data.nodes && data.nodes.length > 0) {
        setSelectedNodeId(data.nodes[0].nodeId)
      }
      if (markUnderInvestigation) {
        markUnderInvestigation(activeCaseId)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [activeCaseId, backendUrl, markUnderInvestigation])

  // Reload current context
  const refreshContext = useCallback(async (caseId = activeCaseId) => {
    if (!caseId) return
    try {
      const res = await fetch(`${backendUrl}/api/investigation/${caseId}`)
      if (!res.ok) throw new Error('Failed to reload case context.')
      const data = await res.json()
      setContext(data)
    } catch (e) {
      setError(e.message)
    }
  }, [activeCaseId, backendUrl])

  // Get specific node details from context
  const getSelectedNode = useCallback(() => {
    if (!context || !selectedNodeId) return null
    return context.nodes.find(n => n.nodeId === selectedNodeId) || null
  }, [context, selectedNodeId])

  // Optimistic update of per-node review status (officerVerdict + optional officerNote)
  const updateNodeVerdict = useCallback(async (nodeId, verdict, officerNote = null) => {
    if (!activeCaseId) return
    // Optimistic Update
    setContext(prev => {
      if (!prev) return null
      return {
        ...prev,
        nodes: prev.nodes.map(n => n.nodeId === nodeId ? { ...n, officerVerdict: verdict, officerNote: officerNote } : n)
      }
    })

    try {
      const res = await fetch(`${backendUrl}/api/investigation/${activeCaseId}/node/${nodeId}/review-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerVerdict: verdict, officerNote: officerNote })
      })
      if (!res.ok) throw new Error('Failed to update node review status.')
      // Refresh to pick up timeline entries added by backend
      await refreshContext()
    } catch (e) {
      setError(e.message)
      // Rollback optimistic update
      refreshContext()
    }
  }, [activeCaseId, backendUrl, refreshContext])

  // Optimistic update of per-node action recommendation
  const updateNodeAction = useCallback(async (nodeId, action) => {
    if (!activeCaseId) return
    // Optimistic Update
    setContext(prev => {
      if (!prev) return null
      return {
        ...prev,
        nodes: prev.nodes.map(n => n.nodeId === nodeId ? { ...n, nodeAction: action } : n)
      }
    })

    try {
      const res = await fetch(`${backendUrl}/api/investigation/${activeCaseId}/node/${nodeId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeAction: action })
      })
      if (!res.ok) throw new Error('Failed to update node action recommendation.')
    } catch (e) {
      setError(e.message)
      // Rollback optimistic update
      refreshContext()
    }
  }, [activeCaseId, backendUrl, refreshContext])

  // Add a human case note (never triggers AI)
  const addCaseNote = useCallback(async (content) => {
    if (!activeCaseId) return
    try {
      const res = await fetch(`${backendUrl}/api/investigation/${activeCaseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      if (!res.ok) throw new Error('Failed to append case note.')
      await refreshContext()
    } catch (e) {
      setError(e.message)
    }
  }, [activeCaseId, backendUrl, refreshContext])

  // Trigger AI re-evaluation (full context send)
  const reanalyzeAI = useCallback(async (focusNodeId, officerComment) => {
    if (!activeCaseId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${backendUrl}/api/investigation/${activeCaseId}/reanalyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusNodeId, officerComment })
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'AI Copilot reanalysis failed.')
      }
      await refreshContext()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [activeCaseId, backendUrl, refreshContext])

  // Submit case recommendation before escalation
  const submitCaseRecommendation = useCallback(async (selectedAction, rationale, officerId) => {
    if (!activeCaseId) return
    try {
      const res = await fetch(`${backendUrl}/api/investigation/${activeCaseId}/recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedAction, rationale, officerId, timestamp: new Date().toISOString() })
      })
      if (!res.ok) throw new Error('Failed to save case recommendation.')
      await refreshContext()
    } catch (e) {
      setError(e.message)
    }
  }, [activeCaseId, backendUrl, refreshContext])

  // Escalates the case (guarded transition)
  const proceedToLegal = useCallback(async (officerId) => {
    if (!activeCaseId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${backendUrl}/api/investigation/${activeCaseId}/proceed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerId })
      })
      if (!res.ok) throw new Error('Escalation failed or transition is invalid.')
      
      if (approveContainment) {
        approveContainment(activeCaseId)
      }

      // Reset state and clear active view
      setActiveCaseId(null)
      setCaseSnapshot(null)
      setContext(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [activeCaseId, backendUrl, approveContainment])

  const closeCaseAsFalsePositive = useCallback(async (reason) => {
    if (!activeCaseId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${backendUrl}/api/investigation/${activeCaseId}/close-false-positive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (!res.ok) throw new Error('Failed to close case.')

      if (markFalsePositive) {
        markFalsePositive(activeCaseId)
      }

      setActiveCaseId(null)
      setCaseSnapshot(null)
      setContext(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [activeCaseId, backendUrl, markFalsePositive])

  const exitWorkspace = useCallback(() => {
    setActiveCaseId(null)
    setCaseSnapshot(null)
    setContext(null)
    setSelectedNodeId(null)
  }, [])

  return (
    <InvestigationContext.Provider value={{
      activeCaseId,
      caseSnapshot,
      context,
      loading,
      error,
      selectedNodeId,
      setSelectedNodeId,
      startInvestigation,
      buildGraph,
      refreshContext,
      getSelectedNode,
      updateNodeVerdict,
      updateNodeAction,
      addCaseNote,
      reanalyzeAI,
      submitCaseRecommendation,
      proceedToLegal,
      closeCaseAsFalsePositive,
      exitWorkspace
    }}>
      {children}
    </InvestigationContext.Provider>
  )
}

export function useInvestigation() {
  const context = useContext(InvestigationContext)
  if (!context) throw new Error('useInvestigation must be used within an InvestigationProvider')
  return context
}
