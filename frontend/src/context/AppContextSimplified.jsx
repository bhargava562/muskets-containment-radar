import { createContext, useContext, useState, useCallback } from 'react'
import mockData from '../data/iob_mock_data.json'

const AppContext = createContext(null)

// Case statuses — the 3-step workflow pipeline
export const CASE_STATUS = {
  PENDING_TRIAGE: 'PENDING_TRIAGE',
  AWAITING_LEGAL_REVIEW: 'AWAITING_LEGAL_REVIEW',
  RESTRICTION_ACTIVE: 'RESTRICTION_ACTIVE'
}

export function AppProvider({ children }) {
  const [cases, setCases] = useState(mockData.cases)
  const [selectedCaseId, setSelectedCaseId] = useState(null)

  // Get the currently selected case object
  const getSelectedCase = useCallback(() => {
    return cases.find(c => c.id === selectedCaseId) || null
  }, [cases, selectedCaseId])

  // Update case status — core workflow function
  const updateCaseStatus = useCallback((caseId, newStatus) => {
    setCases(prev => prev.map(c =>
      c.id === caseId ? { ...c, status: newStatus } : c
    ))
  }, [])

  // AML Analyst action: approve containment → AWAITING_LEGAL_REVIEW
  const approveContainment = useCallback((caseId) => {
    setCases(prev => prev.map(c =>
      c.id === caseId
        ? { ...c, status: CASE_STATUS.AWAITING_LEGAL_REVIEW, analystName: 'Current Officer' }
        : c
    ))
    setSelectedCaseId(null)
  }, [])

  // Compliance action: finalize restriction → RESTRICTION_ACTIVE
  const finalizeRestriction = useCallback((caseId) => {
    updateCaseStatus(caseId, CASE_STATUS.RESTRICTION_ACTIVE)
  }, [updateCaseStatus])

  // Get cases filtered by status
  const getCasesByStatus = useCallback((status) => {
    return cases.filter(c => c.status === status)
  }, [cases])

  // Get graph data for a case by graphId
  const getGraphForCase = useCallback((graphId) => {
    return mockData.graphStructures[graphId] || null
  }, [])

  const value = {
    cases,
    selectedCaseId,
    setSelectedCaseId,
    getSelectedCase,
    updateCaseStatus,
    approveContainment,
    finalizeRestriction,
    getCasesByStatus,
    getGraphForCase
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
