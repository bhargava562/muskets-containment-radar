import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import mockData from '../data/iob_mock_data.json'

const AppContext = createContext(null)

const STORAGE_VERSION = 'v3'
const STORAGE_KEYS = {
  CASES: 'muskets_cases',
  SELECTED: 'muskets_selected_case',
  VERSION: 'muskets_storage_version'
}

export const CASE_STATUS = {
  PENDING_TRIAGE: 'PENDING_TRIAGE',
  AWAITING_LEGAL_REVIEW: 'AWAITING_LEGAL_REVIEW',
  RESTRICTION_ACTIVE: 'RESTRICTION_ACTIVE',
  RETURNED_TO_AML: 'RETURNED_TO_AML',
  CLOSED_FALSE_POSITIVE: 'CLOSED_FALSE_POSITIVE',
  RESOLVED: 'RESOLVED'
}

// --- Workflow State Machine ---
// Map of valid source → [valid targets]
const VALID_TRANSITIONS = {
  [CASE_STATUS.PENDING_TRIAGE]: [CASE_STATUS.AWAITING_LEGAL_REVIEW, CASE_STATUS.CLOSED_FALSE_POSITIVE],
  [CASE_STATUS.AWAITING_LEGAL_REVIEW]: [CASE_STATUS.RESTRICTION_ACTIVE, CASE_STATUS.RETURNED_TO_AML, CASE_STATUS.CLOSED_FALSE_POSITIVE],
  [CASE_STATUS.RETURNED_TO_AML]: [CASE_STATUS.AWAITING_LEGAL_REVIEW, CASE_STATUS.CLOSED_FALSE_POSITIVE],
  [CASE_STATUS.RESTRICTION_ACTIVE]: [CASE_STATUS.RESOLVED],
  [CASE_STATUS.CLOSED_FALSE_POSITIVE]: [],
  [CASE_STATUS.RESOLVED]: []
}

// --- Audit Log Helper ---
function createAuditEntry(actor, action, details) {
  const entry = { actor, action, timestamp: new Date().toISOString() }
  if (details) entry.details = details
  return entry
}

function safeReadStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const saved = localStorage.getItem(key)
    if (saved) return JSON.parse(saved)
  } catch (e) {
    console.error(`Corrupted localStorage key "${key}", resetting.`)
    localStorage.removeItem(key)
  }
  return fallback
}

function isValidTransition(fromStatus, toStatus) {
  const allowed = VALID_TRANSITIONS[fromStatus]
  if (!allowed) return false
  return allowed.includes(toStatus)
}

export function AppProvider({ children }) {
  const [cases, setCases] = useState(() => {
    try {
      if (typeof window === 'undefined') return mockData.cases
      const saved = localStorage.getItem(STORAGE_KEYS.CASES)
      const savedVersion = localStorage.getItem(STORAGE_KEYS.VERSION)
      if (saved && savedVersion === STORAGE_VERSION) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
        throw new Error('Invalid storage schema: expected non-empty array')
      }
    } catch (e) {
      console.error('Storage read error or schema mismatch, falling back to mock data.', e)
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.VERSION, STORAGE_VERSION)
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(mockData.cases))
    }
    return mockData.cases
  })

  const [selectedCaseId, setSelectedCaseId] = useState(() => safeReadStorage(STORAGE_KEYS.SELECTED, null))

  // Persist cases
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases)) } catch (e) {}
  }, [cases])

  // Persist selected case
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (selectedCaseId) localStorage.setItem(STORAGE_KEYS.SELECTED, JSON.stringify(selectedCaseId))
      else localStorage.removeItem(STORAGE_KEYS.SELECTED)
    } catch (e) {}
  }, [selectedCaseId])

  // Auto-deselect if selected case no longer exists
  useEffect(() => {
    if (selectedCaseId && !cases.find(c => c.id === selectedCaseId)) setSelectedCaseId(null)
  }, [cases, selectedCaseId])

  // Cross-Tab Sync
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleStorageChange = (e) => {
      if (e.storageArea !== localStorage) return
      if (e.key === STORAGE_KEYS.VERSION && e.newValue !== STORAGE_VERSION) return
      if (e.key === STORAGE_KEYS.CASES && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) setCases(parsed)
        } catch (err) {}
      }
      if (e.key === STORAGE_KEYS.SELECTED) {
        try { setSelectedCaseId(e.newValue ? JSON.parse(e.newValue) : null) } catch (err) {}
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const getSelectedCase = useCallback(() => cases.find(c => c.id === selectedCaseId) || null, [cases, selectedCaseId])

  // --- Generic guarded transition ---
  const transitionCase = useCallback((caseId, toStatus, actor, action, details, extraFields = {}) => {
    setCases(prev => {
      const target = prev.find(c => c.id === caseId)
      if (!target) {
        console.warn(`transitionCase: case ${caseId} not found.`)
        return prev
      }
      if (!isValidTransition(target.status, toStatus)) {
        console.warn(`transitionCase: illegal ${target.status} → ${toStatus} for case ${caseId}.`)
        return prev
      }
      return prev.map(c => c.id === caseId ? {
        ...c,
        status: toStatus,
        auditLog: [...(c.auditLog || []), createAuditEntry(actor, action, details)],
        ...extraFields
      } : c)
    })
  }, [])

  // --- Workflow Actions ---

  const approveContainment = useCallback((caseId) => {
    transitionCase(
      caseId,
      CASE_STATUS.AWAITING_LEGAL_REVIEW,
      'AML Officer',
      'Partial lien approved — forwarded to Legal Review',
      null,
      { analystName: 'Current Officer', analystApprovedAt: new Date().toISOString() }
    )
    // Auto-focus next PENDING_TRIAGE or RETURNED_TO_AML case
    setCases(currentCases => {
      const remaining = currentCases.filter(c =>
        (c.status === CASE_STATUS.PENDING_TRIAGE || c.status === CASE_STATUS.RETURNED_TO_AML) && c.id !== caseId
      )
      setSelectedCaseId(remaining.length > 0 ? remaining[0].id : null)
      return currentCases
    })
  }, [transitionCase])

  const finalizeRestriction = useCallback((caseId) => {
    transitionCase(
      caseId,
      CASE_STATUS.RESTRICTION_ACTIVE,
      'Legal Officer',
      'Restriction authorized and finalized',
      null,
      { legalAuthorizedAt: new Date().toISOString() }
    )
  }, [transitionCase])

  const markFalsePositive = useCallback((caseId) => {
    transitionCase(
      caseId,
      CASE_STATUS.CLOSED_FALSE_POSITIVE,
      'AML Officer',
      'Case closed — marked as false positive',
      null,
      { closedAt: new Date().toISOString() }
    )
    // Auto-focus next active case
    setCases(currentCases => {
      const remaining = currentCases.filter(c =>
        (c.status === CASE_STATUS.PENDING_TRIAGE || c.status === CASE_STATUS.RETURNED_TO_AML) && c.id !== caseId
      )
      setSelectedCaseId(remaining.length > 0 ? remaining[0].id : null)
      return currentCases
    })
  }, [transitionCase])

  const returnToAML = useCallback((caseId, reason) => {
    transitionCase(
      caseId,
      CASE_STATUS.RETURNED_TO_AML,
      'Legal Officer',
      'Case returned to AML for further review',
      reason || 'No reason provided'
    )
  }, [transitionCase])

  const rejectCase = useCallback((caseId, reason) => {
    transitionCase(
      caseId,
      CASE_STATUS.CLOSED_FALSE_POSITIVE,
      'Legal Officer',
      'Case rejected and funds released',
      reason || 'No reason provided',
      { closedAt: new Date().toISOString() }
    )
  }, [transitionCase])

  // --- Non-Transition Actions (mutate case data, NOT status) ---

  const updateInvestigatorNotes = useCallback((caseId, notes) => {
    setCases(prev => prev.map(c => c.id === caseId ? {
      ...c,
      investigatorNotes: notes,
      auditLog: [...(c.auditLog || []), createAuditEntry('AML Officer', 'Investigator notes updated')]
    } : c))
  }, [])

  // Simulated AI Reanalysis — deterministic, no external API
  const reanalyzeAIRef = useRef(new Set()) // prevent duplicate concurrent calls
  const reanalyzeAI = useCallback((caseId) => {
    if (reanalyzeAIRef.current.has(caseId)) return // already running
    reanalyzeAIRef.current.add(caseId)

    // Append "analyzing" audit entry immediately
    setCases(prev => prev.map(c => c.id === caseId ? {
      ...c,
      _aiReanalyzing: true,
      auditLog: [...(c.auditLog || []), createAuditEntry('System', 'AI reanalysis initiated by investigator')]
    } : c))

    // Simulate 1.5s processing delay
    setTimeout(() => {
      setCases(prev => prev.map(c => {
        if (c.id !== caseId) return c
        // Cycle through alternate summaries
        const alts = c.alternateAISummaries || []
        const currentIdx = alts.indexOf(c.aiSummary)
        const nextIdx = (currentIdx + 1) % Math.max(alts.length, 1)
        const newSummary = alts.length > 0 ? alts[nextIdx] : c.aiSummary

        return {
          ...c,
          aiSummary: newSummary,
          _aiReanalyzing: false,
          auditLog: [...(c.auditLog || []), createAuditEntry('System', 'AI analysis regenerated after investigator feedback')]
        }
      }))
      reanalyzeAIRef.current.delete(caseId)
    }, 1500)
  }, [])

  const appendAuditLog = useCallback((caseId, actor, action, details) => {
    setCases(prev => prev.map(c => c.id === caseId ? {
      ...c,
      auditLog: [...(c.auditLog || []), createAuditEntry(actor, action, details)]
    } : c))
  }, [])

  const getCasesByStatus = useCallback((status) => cases.filter(c => c.status === status), [cases])
  const getCasesByStatuses = useCallback((statuses) => cases.filter(c => statuses.includes(c.status)), [cases])
  const getGraphForCase = useCallback((graphId) => mockData.graphStructures[graphId] || null, [])

  const resetDatabase = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEYS.CASES)
    localStorage.removeItem(STORAGE_KEYS.SELECTED)
    localStorage.removeItem(STORAGE_KEYS.VERSION)
    setCases(mockData.cases)
    setSelectedCaseId(null)
    localStorage.setItem(STORAGE_KEYS.VERSION, STORAGE_VERSION)
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(mockData.cases))
  }, [])

  const value = {
    cases, selectedCaseId, setSelectedCaseId,
    getSelectedCase, getCasesByStatus, getCasesByStatuses, getGraphForCase,
    approveContainment, finalizeRestriction, markFalsePositive,
    returnToAML, rejectCase,
    updateInvestigatorNotes, reanalyzeAI, appendAuditLog,
    resetDatabase
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within an AppProvider')
  return context
}

export default AppContext
