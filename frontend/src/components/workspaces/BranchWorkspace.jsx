import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Upload, Send, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { useApp, CASE_STATUS } from '../../context/AppContextSimplified'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const BranchWorkspace = ({ activeView }) => {
  const { cases } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [escalationNote, setEscalationNote] = useState('')
  const [escalationSubmitted, setEscalationSubmitted] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState([])

  const handleSearch = () => {
    if (!searchQuery.trim()) return

    // Search across all cases for the account
    for (const caseItem of cases) {
      if (caseItem.victimAccount === searchQuery ||
          caseItem.muleAccounts.includes(searchQuery) ||
          caseItem.merchantAccounts.includes(searchQuery)) {

        // Found the account - determine status
        const isRestricted = caseItem.status !== CASE_STATUS.PENDING_TRIAGE

        setSelectedCustomer({
          account: searchQuery,
          caseId: caseItem.id,
          caseStatus: caseItem.status,
          isRestricted: isRestricted,
          restrictedAmount: isRestricted ? caseItem.recoverableAmount : 0,
          availableBalance: isRestricted ? 2000000 - caseItem.recoverableAmount : 2000000,
          totalBalance: 2000000
        })
        return
      }
    }

    // Account not found
    setSelectedCustomer(null)
  }

  const handleEscalation = () => {
    setEscalationSubmitted(true)
    setTimeout(() => setEscalationSubmitted(false), 3000)
    setEscalationNote('')
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
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-white rounded-lg border">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-slate-50">
        <h1 className="text-lg font-bold text-slate-900">CUSTOMER LOOKUP</h1>
        <p className="text-sm text-slate-600 mt-1">Search for accounts and view restriction status</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Search Section */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-900">Account Number</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter account number (e.g., 185501000012847)"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <motion.button
              onClick={handleSearch}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-800"
            >
              <Search className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Results */}
        {selectedCustomer ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Restriction Status Card */}
            <div className={`p-4 rounded-lg border-2 ${
              selectedCustomer.isRestricted
                ? 'bg-red-50 border-red-300'
                : 'bg-emerald-50 border-emerald-300'
            }`}>
              <div className="flex items-start gap-3">
                {selectedCustomer.isRestricted ? (
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">
                    {selectedCustomer.isRestricted ? 'RESTRICTED' : 'ACTIVE'}
                  </h3>
                  <p className="text-sm text-slate-700 mt-2">
                    Account: <span className="font-mono font-bold">{selectedCustomer.account}</span>
                  </p>
                </div>
              </div>

              {/* Financial Details */}
              {selectedCustomer.isRestricted && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Restricted Amount:</span>
                    <span className="font-bold text-red-600">{formatCurrency(selectedCustomer.restrictedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Available Balance:</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(selectedCustomer.availableBalance)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-slate-600">Total Balance:</span>
                    <span className="font-bold">{formatCurrency(selectedCustomer.totalBalance)}</span>
                  </div>

                  {/* Explanation */}
                  <div className="mt-4 p-3 bg-white rounded border border-slate-200">
                    <p className="text-xs text-slate-700">
                      <span className="font-semibold">Why this restriction?</span><br/>
                      Temporary restriction applied due to suspicious transaction velocity. Essential services remain active. This is a precautionary measure while investigation is ongoing.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Request Central Review */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">REQUEST CENTRAL REVIEW</h3>
              <textarea
                value={escalationNote}
                onChange={(e) => setEscalationNote(e.target.value)}
                placeholder="Add notes for central team (optional)"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm"
                rows={4}
              />
              <motion.button
                onClick={handleEscalation}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={escalationSubmitted}
                className={`w-full px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                  escalationSubmitted
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-700 text-white hover:bg-slate-800'
                }`}
              >
                {escalationSubmitted ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Submitted
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Escalation
                  </>
                )}
              </motion.button>
            </div>

            {/* KYC Document Upload */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">KYC VERIFICATION DOCS</h3>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="p-6 border-2 border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors"
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Drag & drop KYC documents here</p>
                <p className="text-xs text-slate-500 mt-1">or click to browse</p>
              </div>

              {uploadedDocs.length > 0 && (
                <div className="space-y-2">
                  {uploadedDocs.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded text-sm">
                      <Info className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700">{doc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Search for an account to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BranchWorkspace
