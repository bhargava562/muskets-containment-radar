import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ShieldAlert, CheckCircle, PhoneCall, Upload, FileText, Loader2, AlertTriangle } from 'lucide-react'
import { useApp, CASE_STATUS } from '../../context/AppContextSimplified'

const fmt = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const INTERACTION_ACTIONS = [
  { action: 'CUSTOMER_CONTACTED', label: 'Customer Contacted', icon: PhoneCall },
  { action: 'CUSTOMER_VISITED', label: 'Customer Visited Branch', icon: Users },
  { action: 'DOCUMENTS_SUBMITTED', label: 'Documents Submitted', icon: FileText },
]

export default function BranchWorkspace() {
  const { getCasesByStatus } = useApp()
  const activeCases = getCasesByStatus(CASE_STATUS.RESTRICTION_ACTIVE)

  const [selectedCase, setSelectedCase] = useState(null)
  const [loggedActions, setLoggedActions] = useState({})   // { caseId: Set<action> }
  const [uploading, setUploading] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState([])     // [{ name, evidenceId }]
  const [executing, setExecuting] = useState(false)
  const [toast, setToast] = useState('')
  const [execError, setExecError] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleSelectCase = (c) => {
    setSelectedCase(c)
    setUploadedDocs([])
    setExecError(null)
  }

  const caseActions = selectedCase ? (loggedActions[selectedCase.id] ?? new Set()) : new Set()

  const logAction = useCallback(async (action, note = '') => {
    if (!selectedCase || caseActions.has(action)) return
    try {
      const res = await fetch(`${BACKEND}/api/investigation/${selectedCase.id}/execution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note })
      })
      if (!res.ok) throw new Error('Log failed')
      setLoggedActions(prev => ({
        ...prev,
        [selectedCase.id]: new Set([...(prev[selectedCase.id] ?? []), action])
      }))
      showToast(`Logged: ${action.replace(/_/g, ' ').toLowerCase()}`)
    } catch {
      showToast('Action log failed — backend may be offline')
    }
  }, [selectedCase, caseActions])

  const handleFileUpload = useCallback(async (files) => {
    if (!selectedCase || !files.length) return
    setUploading(true)
    const results = []
    for (const file of files) {
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('uploadedBy', 'Branch Manager')
        const res = await fetch(`${BACKEND}/api/investigation/${selectedCase.id}/evidence`, {
          method: 'POST',
          body: form
        })
        if (res.ok) {
          results.push(file.name)
          await logAction('DOCUMENTS_SUBMITTED', `Uploaded: ${file.name}`)
        }
      } catch { /* individual file failure — continue */ }
    }
    setUploadedDocs(prev => [...prev, ...results])
    if (results.length) showToast(`${results.length} document(s) uploaded`)
    setUploading(false)
  }, [selectedCase, logAction])

  const handleExecute = useCallback(async (action) => {
    if (!selectedCase || executing) return
    setExecuting(true)
    setExecError(null)
    try {
      const res = await fetch(`${BACKEND}/api/investigation/${selectedCase.id}/execution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: action === 'RESTRICTION_APPLIED' ? 'Restriction applied by branch' : 'Unable to apply restriction' })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Execution failed')
      }
      const data = await res.json()
      showToast(action === 'RESTRICTION_APPLIED' ? 'Restriction applied — case resolved' : 'Status recorded')
      if (data.caseStatus === 'RESOLVED') setSelectedCase(null)
    } catch (e) {
      setExecError(e.message)
    } finally {
      setExecuting(false)
    }
  }, [selectedCase, executing])

  const restrictedPct = selectedCase
    ? Math.min(100, (selectedCase.tracedAmount / selectedCase.totalBalance) * 100)
    : 0

  return (
    <div className="h-full w-full flex overflow-hidden bg-slate-950">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-emerald-500/90 text-white text-sm font-semibold rounded-xl shadow-lg backdrop-blur flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />{toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left — case list */}
      <div className="w-[300px] flex-shrink-0 h-full flex flex-col border-r border-slate-800/50">
        <div className="px-4 py-4 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-200 tracking-wide">ASSIGNED CASES</h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{activeCases.length} active restriction{activeCases.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeCases.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-600">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">No active restrictions</p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {activeCases.map(c => {
                const pct = Math.min(100, (c.tracedAmount / c.totalBalance) * 100).toFixed(1)
                const isSelected = selectedCase?.id === c.id
                return (
                  <motion.button key={c.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSelectCase(c)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${isSelected ? 'border-amber-500/30 bg-amber-500/5 ring-1 ring-amber-500/20' : 'border-slate-800/50 bg-slate-900/30 hover:bg-slate-800/30'}`}
                    whileTap={{ scale: 0.98 }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-slate-300">{c.customerName}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold">RESTRICTED</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between"><span className="text-slate-500">Restricted</span><span className="font-mono text-amber-400">{fmt(c.tracedAmount)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Available</span><span className="font-mono text-emerald-400">{fmt(c.totalBalance - c.tracedAmount)}</span></div>
                      <div className="w-full h-1 rounded-full bg-slate-800 mt-1.5 overflow-hidden flex">
                        <div className="h-full bg-amber-500/50" style={{ width: `${pct}%` }} />
                        <div className="h-full bg-emerald-500/40" style={{ width: `${100 - parseFloat(pct)}%` }} />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600 font-mono mt-2">{c.id}</p>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Right — execution panel */}
      <div className="flex-1 overflow-y-auto">
        {!selectedCase ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-slate-600">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-xs">Select a case to begin execution</p>
            </div>
          </div>
        ) : (
          <motion.div key={selectedCase.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="p-6 space-y-5 max-w-2xl">

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-amber-400">
                {selectedCase.customerName.charAt(0)}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-200">{selectedCase.customerName}</h2>
                <p className="text-[11px] text-slate-500 font-mono">{selectedCase.id}</p>
              </div>
            </div>

            {/* Restriction details */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <h3 className="text-xs font-bold text-amber-400 mb-3">RESTRICTION DETAILS</h3>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-500">Restricted Amount</span><span className="font-mono font-bold text-amber-400">{fmt(selectedCase.tracedAmount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Available Balance</span><span className="font-mono font-bold text-emerald-400">{fmt(selectedCase.totalBalance - selectedCase.tracedAmount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total Balance</span><span className="font-mono text-slate-300">{fmt(selectedCase.totalBalance)}</span></div>
              </div>
              {/* Visual bar */}
              <div className="mt-3">
                <div className="w-full h-6 rounded-lg overflow-hidden flex bg-slate-800">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${restrictedPct}%` }} transition={{ duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-500 flex items-center justify-center">
                    {restrictedPct > 15 && <span className="text-[9px] font-bold text-white px-1">Restricted</span>}
                  </motion.div>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${100 - restrictedPct}%` }} transition={{ duration: 0.8, delay: 0.1 }}
                    className="h-full bg-gradient-to-r from-emerald-700 to-emerald-600 flex items-center justify-center">
                    {(100 - restrictedPct) > 15 && <span className="text-[9px] font-bold text-white px-1">Available</span>}
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Customer interaction log */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-400 tracking-widest">CUSTOMER INTERACTION</h3>
              <div className="grid grid-cols-3 gap-2">
                {INTERACTION_ACTIONS.map(({ action, label, icon: Icon }) => {
                  const done = caseActions.has(action)
                  return (
                    <button key={action} onClick={() => logAction(action)} disabled={done}
                      className={`p-3 rounded-xl border text-center transition-all ${done ? 'border-emerald-500/30 bg-emerald-500/5 cursor-not-allowed' : 'border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/30'}`}>
                      <Icon className={`w-4 h-4 mx-auto mb-1 ${done ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <p className={`text-[10px] font-semibold ${done ? 'text-emerald-400' : 'text-slate-400'}`}>{label}</p>
                      {done && <p className="text-[9px] text-emerald-500 mt-0.5">✓ Logged</p>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Document upload — calls existing EvidenceController */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 tracking-widest">UPLOAD DOCUMENTS</h3>
              <p className="text-[11px] text-slate-500">KYC, invoices, GST proof, police communications</p>
              <label className={`block p-5 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${uploading ? 'border-slate-700 opacity-50' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-900/30'}`}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFileUpload(Array.from(e.dataTransfer.files)) }}>
                {uploading ? <Loader2 className="w-6 h-6 text-slate-500 mx-auto mb-2 animate-spin" /> : <Upload className="w-6 h-6 text-slate-600 mx-auto mb-2" />}
                <p className="text-xs text-slate-500">{uploading ? 'Uploading…' : 'Drag & drop or click to browse'}</p>
                <input type="file" className="hidden" multiple disabled={uploading}
                  onChange={e => handleFileUpload(Array.from(e.target.files))} />
              </label>
              {uploadedDocs.length > 0 && (
                <div className="space-y-1.5">
                  {uploadedDocs.map((name, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800/30">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs text-slate-400 flex-1 truncate">{name}</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Execution status */}
            <div className="space-y-2 pt-2 border-t border-slate-800/50">
              <h3 className="text-[10px] font-bold text-slate-400 tracking-widest">EXECUTION STATUS</h3>
              {execError && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <p className="text-[10px] text-red-400">{execError}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleExecute('UNABLE_TO_APPLY')} disabled={executing}
                  className="flex-1 py-2.5 rounded-xl text-[11px] font-bold border border-slate-700/50 bg-slate-900/50 text-slate-400 hover:bg-slate-800/50 disabled:opacity-40 transition-all">
                  Unable to Apply
                </button>
                <button onClick={() => handleExecute('RESTRICTION_APPLIED')} disabled={executing}
                  className="flex-1 py-2.5 rounded-xl text-[11px] font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/15 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5">
                  {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  {executing ? 'Processing…' : 'Restriction Applied'}
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-600">
                "Restriction Applied" closes the case and notifies AML and Principal Officer.
              </p>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  )
}
