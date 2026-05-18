import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Send, AlertTriangle, CheckCircle, Users, ShieldAlert, FileText, ArrowUpRight, PhoneCall } from 'lucide-react'
import { useApp, CASE_STATUS } from '../../context/AppContextSimplified'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const BranchWorkspace = () => {
  const { getCasesByStatus, appendAuditLog } = useApp()
  const [selectedCustomerCase, setSelectedCustomerCase] = useState(null)
  const [escalationNote, setEscalationNote] = useState('')
  const [escalationSubmitted, setEscalationSubmitted] = useState(false)
  const [customerContacted, setCustomerContacted] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState([])

  const activeCases = getCasesByStatus(CASE_STATUS.RESTRICTION_ACTIVE)

  // Reset states when changing selected case
  const handleSelectCase = (caseItem) => {
    setSelectedCustomerCase(caseItem)
    setEscalationNote('')
    setEscalationSubmitted(false)
    setCustomerContacted(false)
    setUploadedDocs([])
  }

  const handleEscalation = () => {
    if (!escalationNote.trim() || escalationSubmitted) return
    appendAuditLog(
      selectedCustomerCase.id, 
      'Branch Manager', 
      'Escalated to Central AML Review', 
      `Reason: ${escalationNote}`
    )
    setEscalationSubmitted(true)
    // Keep it submitted for the demo context, don't reset automatically
  }

  const handleCustomerContacted = () => {
    if (customerContacted) return
    appendAuditLog(
      selectedCustomerCase.id,
      'Branch Manager',
      'Customer contacted regarding restriction'
    )
    setCustomerContacted(true)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files)
    setUploadedDocs(prev => [...prev, ...files.map(f => f.name)])
    appendAuditLog(
      selectedCustomerCase.id,
      'Branch Manager',
      `Uploaded ${files.length} clarification document(s)`
    )
  }

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files)
    setUploadedDocs(prev => [...prev, ...files.map(f => f.name)])
    appendAuditLog(
      selectedCustomerCase.id,
      'Branch Manager',
      `Uploaded ${files.length} clarification document(s)`
    )
  }

  return (
    <div className="h-full w-full flex overflow-hidden bg-slate-950">
      {/* Left — Assigned Customer Cases */}
      <div className="w-[320px] flex-shrink-0 h-full flex flex-col border-r border-slate-800/50">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-200 tracking-wide">ASSIGNED CASES</h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {activeCases.length} customer{activeCases.length !== 1 ? 's' : ''} with active restrictions
          </p>
        </div>

        {/* Case List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeCases.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-600">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">No active restrictions</p>
                <p className="text-[10px] text-slate-700 mt-1">All clear at this branch</p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {activeCases.map(caseItem => {
                const isSelected = selectedCustomerCase?.id === caseItem.id
                const restrictedPercent = ((caseItem.tracedAmount / caseItem.totalBalance) * 100).toFixed(1)

                return (
                  <motion.button
                    key={caseItem.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSelectCase(caseItem)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-amber-500/30 bg-amber-500/5 ring-1 ring-amber-500/20'
                        : 'border-slate-800/50 bg-slate-900/30 hover:bg-slate-800/30'
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-slate-300">{caseItem.customerName}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold">
                        RESTRICTED
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Restricted</span>
                        <span className="font-mono text-amber-400">{formatCurrency(caseItem.tracedAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Available</span>
                        <span className="font-mono text-emerald-400">{formatCurrency(caseItem.totalBalance - caseItem.tracedAmount)}</span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="w-full h-1 rounded-full bg-slate-800 mt-1.5 overflow-hidden flex">
                        <div className="h-full bg-amber-500/50" style={{ width: `${restrictedPercent}%` }} />
                        <div className="h-full bg-emerald-500/40" style={{ width: `${100 - parseFloat(restrictedPercent)}%` }} />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600 font-mono mt-2">{caseItem.id}</p>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Right — Customer Interaction Panel */}
      <div className="flex-1 overflow-y-auto">
        {selectedCustomerCase ? (
          <motion.div
            key={selectedCustomerCase.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 space-y-5 max-w-2xl"
          >
            {/* Customer Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-amber-400">
                  {selectedCustomerCase.customerName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-200">{selectedCustomerCase.customerName}</h2>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedCustomerCase.id}</p>
                </div>
              </div>
              <motion.button
                onClick={handleCustomerContacted}
                disabled={customerContacted}
                whileHover={!customerContacted ? { scale: 1.05 } : {}}
                whileTap={!customerContacted ? { scale: 0.95 } : {}}
                className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 border transition-all ${
                  customerContacted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {customerContacted ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Customer Contacted
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4" />
                    Mark Contacted
                  </>
                )}
              </motion.button>
            </div>

            {/* Restriction Explanation Card */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-amber-400 mb-2">Temporary Restriction Applied</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    A proportional restriction has been placed on this account as part of an ongoing investigation.
                    Essential banking services remain fully active. This is a precautionary measure to protect
                    recoverable funds while the investigation is resolved.
                  </p>
                </div>
              </div>
            </div>

            {/* Impact Visibility — Restricted vs Available */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 space-y-4">
              <h3 className="text-[10px] font-bold text-slate-400 tracking-widest">ACCOUNT IMPACT</h3>

              {/* Visual bar */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-amber-400 font-semibold">Restricted Funds</span>
                  <span className="text-emerald-400 font-semibold">Available Balance</span>
                </div>
                <div className="w-full h-8 rounded-xl overflow-hidden flex bg-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(selectedCustomerCase.tracedAmount / selectedCustomerCase.totalBalance * 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-500 flex items-center justify-center"
                  >
                    <span className="text-[10px] font-bold text-white px-2 whitespace-nowrap">
                      {formatCurrency(selectedCustomerCase.tracedAmount)}
                    </span>
                  </motion.div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((selectedCustomerCase.totalBalance - selectedCustomerCase.tracedAmount) / selectedCustomerCase.totalBalance * 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center"
                  >
                    <span className="text-[10px] font-bold text-white px-2 whitespace-nowrap">
                      {formatCurrency(selectedCustomerCase.totalBalance - selectedCustomerCase.tracedAmount)}
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-800/50 text-center">
                  <p className="text-[10px] text-slate-500 mb-1">Restricted</p>
                  <p className="text-sm font-mono font-bold text-amber-400">{formatCurrency(selectedCustomerCase.tracedAmount)}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/50 text-center">
                  <p className="text-[10px] text-slate-500 mb-1">Available</p>
                  <p className="text-sm font-mono font-bold text-emerald-400">{formatCurrency(selectedCustomerCase.totalBalance - selectedCustomerCase.tracedAmount)}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/50 text-center">
                  <p className="text-[10px] text-slate-500 mb-1">Total Balance</p>
                  <p className="text-sm font-mono font-bold text-slate-300">{formatCurrency(selectedCustomerCase.totalBalance)}</p>
                </div>
              </div>
            </div>

            {/* Upload Clarification Docs */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 tracking-widest">UPLOAD CLARIFICATION DOCUMENTS</h3>
              <p className="text-[11px] text-slate-500">Customer-provided KYC documents, invoices, or transaction proofs</p>

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="p-5 border-2 border-dashed border-slate-700 rounded-xl text-center cursor-pointer hover:border-slate-600 hover:bg-slate-900/30 transition-all group"
              >
                <Upload className="w-7 h-7 text-slate-600 mx-auto mb-2 group-hover:text-slate-400 transition-colors" />
                <p className="text-xs text-slate-500 group-hover:text-slate-400">Drag & drop documents here</p>
                <p className="text-[10px] text-slate-600 mt-1">KYC • Invoices • GST Proof • Bank Statements</p>
                <label className="inline-block mt-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/15 cursor-pointer transition-colors">
                  Browse Files
                  <input type="file" className="hidden" multiple onChange={handleFileInput} />
                </label>
              </div>

              {uploadedDocs.length > 0 && (
                <div className="space-y-1.5">
                  {uploadedDocs.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800/30">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs text-slate-400 flex-1 truncate">{doc}</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Escalate for Central Review */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
              <h3 className="text-[10px] font-bold text-slate-400 tracking-widest">ESCALATE FOR CENTRAL REVIEW</h3>
              <p className="text-[11px] text-slate-500">
                If the customer disputes the restriction, escalate to the central AML team for re-review.
              </p>
              <textarea
                value={escalationNote}
                onChange={(e) => setEscalationNote(e.target.value)}
                placeholder="Customer claims legitimate payment from known supplier. Requesting analyst re-review..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 resize-none"
                rows={3}
                disabled={escalationSubmitted}
              />
              <motion.button
                onClick={handleEscalation}
                whileHover={!escalationSubmitted && escalationNote.trim() ? { scale: 1.01 } : {}}
                whileTap={!escalationSubmitted && escalationNote.trim() ? { scale: 0.98 } : {}}
                disabled={escalationSubmitted || !escalationNote.trim()}
                className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  escalationSubmitted
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : !escalationNote.trim()
                      ? 'bg-slate-800/50 text-slate-600 border border-slate-700/50 cursor-not-allowed'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {escalationSubmitted ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Escalation Submitted
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    Escalate for Central Review
                  </>
                )}
              </motion.button>
            </div>

            {/* Safety Notice */}
            <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/30">
              <p className="text-[10px] text-slate-600 text-center">
                Branch staff cannot modify or release account restrictions. All restriction decisions are managed by the central AML and compliance teams.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-slate-600">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-xs">Select a customer case to view details</p>
              <p className="text-[10px] text-slate-700 mt-1">Customers with active restrictions will appear in the list</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BranchWorkspace
