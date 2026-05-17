import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import mockData from '../data/iob_mock_data.json'

const AppContext = createContext(null)

const STORAGE_KEYS = { CASES: 'muskets_cases', SELECTED: 'muskets_selected_case' }

export const CASE_STATUS = {
  PENDING_TRIAGE: 'PENDING_TRIAGE',
  AWAITING_LEGAL_REVIEW: 'AWAITING_LEGAL_REVIEW',
  RESTRICTION_ACTIVE: 'RESTRICTION_ACTIVE'
}

function safeReadStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key)
    if (saved) return JSON.parse(saved)
  } catch (e) {
    console.error(`Corrupted localStorage key "${key}", resetting.`)
    localStorage.removeItem(key)
  }
  return fallback
}

export function AppProvider({ children }) {
  const [cases, setCases] = useState(() => {
    const saved = safeReadStorage(STORAGE_KEYS.CASES, null)
    if (saved && Array.isArray(saved) && saved.length > 0) return saved
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(mockData.cases))
    return mockData.cases
  })

  const [selectedCaseId, setSelectedCaseId] = useState(() => {
    return safeReadStorage(STORAGE_KEYS.SELECTED, null)
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases)) } catch (e) { /* fail silently */ }
  }, [cases])

  useEffect(() => {
    try {
      if (selectedCaseId) localStorage.setItem(STORAGE_KEYS.SELECTED, JSON.stringify(selectedCaseId))
      else localStorage.removeItem(STORAGE_KEYS.SELECTED)
    } catch (e) { /* fail silently */ }
  }, [selectedCaseId])

  useEffect(() => {
    if (selectedCaseId && !cases.find(c => c.id === selectedCaseId)) setSelectedCaseId(null)
  }, [cases, selectedCaseId])

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.CASES && e.newValue) {
        try { setCases(JSON.parse(e.newValue)); } catch(err) {}
      }
      if (e.key === STORAGE_KEYS.SELECTED) {
        try { setSelectedCaseId(e.newValue ? JSON.parse(e.newValue) : null); } catch(err) {}
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const getSelectedCase = useCallback(() => cases.find(c => c.id === selectedCaseId) || null, [cases, selectedCaseId])

  const approveContainment = useCallback((caseId) => {
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: CASE_STATUS.AWAITING_LEGAL_REVIEW, analystName: 'Current Officer' } : c))
    setSelectedCaseId(null)
  }, [])

  const finalizeRestriction = useCallback((caseId) => {
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: CASE_STATUS.RESTRICTION_ACTIVE } : c))
  }, [])

  const getCasesByStatus = useCallback((status) => cases.filter(c => c.status === status), [cases])
  const getGraphForCase = useCallback((graphId) => mockData.graphStructures[graphId] || null, [])

  const resetDatabase = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.CASES)
    localStorage.removeItem(STORAGE_KEYS.SELECTED)
    setCases(mockData.cases)
    setSelectedCaseId(null)
  }, [])

  const value = { cases, selectedCaseId, setSelectedCaseId, getSelectedCase, approveContainment, finalizeRestriction, getCasesByStatus, getGraphForCase, resetDatabase }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within an AppProvider')
  return context
}

export default AppContext
