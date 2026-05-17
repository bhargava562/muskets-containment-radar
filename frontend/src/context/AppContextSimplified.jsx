import { createContext, useContext, useState } from 'react'
import mockData from '../data/iob_mock_data.json'

const AppContext = createContext(null)

// Case statuses for workflow continuity
export const CASE_STATUS = {
  PENDING_TRIAGE: 'PENDING_TRIAGE',
  AWAITING_LEGAL_REVIEW: 'AWAITING_LEGAL_REVIEW',
  RESOLVED: 'RESOLVED'
}

// Initial mock cases - hardcoded for prototype
const INITIAL_CASES = [
  {
    id: 'FRA-2026-IOB-00847',
    priority: 'P1',
    riskAmount: 200000,
    recoverableAmount: 135000,
    status: CASE_STATUS.PENDING_TRIAGE,
    summary: '₹2L dispersed to 5 accounts in 42s. Device mismatch detected.',
    timestamp: new Date().toISOString(),
    victimAccount: '185501000012847',
    muleAccounts: ['185502000087321', '039405001234567', '602305001987654'],
    merchantAccounts: ['916010000045678', '185501000089123'],
    graphStructureId: 'fragmentation_network'
  },
  {
    id: 'FRA-2026-IOB-00923',
    priority: 'P2',
    riskAmount: 85000,
    recoverableAmount: 62000,
    status: CASE_STATUS.PENDING_TRIAGE,
    summary: '₹85K split through 3 mules. VPN login flagged.',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    victimAccount: '185501000034567',
    muleAccounts: ['501234000098765', '403201000054321'],
    merchantAccounts: ['916010000045678'],
    graphStructureId: 'fragmentation_network'
  },
  {
    id: 'FRA-2026-IOB-01124',
    priority: 'P3',
    riskAmount: 45000,
    recoverableAmount: 32000,
    status: CASE_STATUS.PENDING_TRIAGE,
    summary: '₹45K fragmentation. Low velocity pattern.',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    victimAccount: '185501000056789',
    muleAccounts: ['712308000034521'],
    merchantAccounts: ['185501000089123'],
    graphStructureId: 'fragmentation_network'
  }
]

export function AppProvider({ children }) {
  const [cases, setCases] = useState(INITIAL_CASES)
  const [selectedCaseId, setSelectedCaseId] = useState(null)
  const [currentUser, setCurrentUser] = useState({ role: 'analyst' }) // 'analyst', 'compliance', 'branch'

  // Get graph data from mock data by structureId
  const getCaseGraphData = (graphStructureId) => {
    return mockData.graph_structures[graphStructureId] || null
  }

  // Get the currently selected case object
  const getSelectedCase = () => {
    return cases.find(c => c.id === selectedCaseId) || null
  }

  // Update case status - core workflow continuity function
  const updateCaseStatus = (caseId, newStatus) => {
    setCases(prev => prev.map(c => 
      c.id === caseId ? { ...c, status: newStatus } : c
    ))
  }

  // Approve containment - Analyst action
  const approveContainment = (caseId) => {
    updateCaseStatus(caseId, CASE_STATUS.AWAITING_LEGAL_REVIEW)
    setSelectedCaseId(null)
  }

  // Resolve case - Compliance action
  const resolveCase = (caseId) => {
    updateCaseStatus(caseId, CASE_STATUS.RESOLVED)
  }

  // Get cases by status
  const getCasesByStatus = (status) => {
    return cases.filter(c => c.status === status)
  }

  const value = {
    cases,
    selectedCaseId,
    setSelectedCaseId,
    currentUser,
    setCurrentUser,
    updateCaseStatus,
    approveContainment,
    resolveCase,
    getCasesByStatus,
    getCaseGraphData,
    getSelectedCase
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
