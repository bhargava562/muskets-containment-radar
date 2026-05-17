import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Shield, TrendingDown, AlertCircle, CheckCircle, Upload, Send, User, FileText, AlertTriangle, Info } from 'lucide-react'
import { useApp, APP_STATES } from '../../context/AppContext'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const BranchWorkspace = () => {
  const { appState, frozenNodes, graphData, caseMetadata } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [uploadedDocs, setUploadedDocs] = useState([])
  const [escalationNote, setEscalationNote] = useState('')
  const [escalationSubmitted, setEscalationSubmitted] = useState(false)

  // Mock customer data - in production this would come from API
  const mockCustomers = [
    {
      id: 'CUST-001',
      name: 'Ramesh Kumar Sharma',
      accountNumber: '185501000012847',
      accountId: 'VICTIM_01',
      status: 'ACTIVE',
      riskLevel: 'LOW',
      restrictedAmount: 0,
      availableBalance: 347000,
      totalBalance: 347000,
      reason: null,
      essentialServicesActive: true,
      lastTransaction: '2026-03-27T10:45:32Z',
      kycStatus: 'VERIFIED',
      accountAge: '4 years 2 months'
    },
    {
      id: 'CUST-002',
      name: 'TechZone Electronics',
      accountNumber: '916010000045678',
      accountId: 'MERCHANT_01',
      status: 'ACTIVE',
      riskLevel: 'LOW',
      restrictedAmount: 0,
      availableBalance: 2100000,
      totalBalance: 2100000,
      reason: null,
      essentialServicesActive: true,
      lastTransaction: '2026-03-27T09:15:10Z',
      kycStatus: 'VERIFIED',
      accountAge: '6 years 8 months'
    }
  ]

  // Update customer status based on frozen nodes
  useEffect(() => {
    if (selectedCustomer && frozenNodes.length > 0) {
      const isFrozen = frozenNodes.includes(selectedCustomer.accountId)
      
      if (isFrozen) {
        // Find the node data to get traced/restricted amount
        const nodeData = graphData?.nodes?.find(n => n.id === selectedCustomer.accountId)
        const restrictedAmount = nodeData?.traced_funds || nodeData?.received_amount || 135000
        const totalBalance = selectedCustomer.totalBalance
        
        setSelectedCustomer(prev => ({
          ...prev,
          status: 'RESTRICTED',
          riskLevel: nodeData?.type === 'mule' ? 'HIGH' : 'MEDIUM',
          restrictedAmount: restrictedAmount,
          availableBalance: Math.max(0, totalBalance - restrictedAmount),
          reason: nodeData?.type === 'mule' 
            ? 'Temporary restriction applied due to suspicious high-velocity transaction activity detected by fraud monitoring system. Account may be compromised.'
            : 'Temporary restriction applied due to receipt of traced stolen funds. This is a precautionary measure while investigation is ongoing. Essential services remain active.'
        }))
      }
    }
  }, [frozenNodes, graphData, selectedCustomer?.accountId])

  const handleSearch = () => {
    const customer = mockCustomers.find(c => 
      c.accountNumber.includes(searchQuery) || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setSelectedCustomer(customer || null)
    setEscalationSubmitted(false)
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    setUploadedDocs(prev => [...prev, ...files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      uploadedAt: new Date().toISOString()
    }))])
  }

  const handleEscalation = () => {
    if (escalationNote.trim()) {
      setEscalationSubmitted(true)
      setTimeout(() => {
        setEscalationNote('')
      }, 3000)
    }
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'HIGH': return { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', dot: 'bg-red-500' }
      case 'MEDIUM': return { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', dot: 'bg-amber-500' }
      case 'LOW': return { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', dot: 'bg-emerald-500' }
      default: return { bg: 'bg-slate-500/20', border: 'border-slate-500/40', text: 'text-slate-400', dot: 'bg-slate-500' }
    }
  }

  return (
    <div className="h-full w-full relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Operational Outcome Metrics Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-4 z-40 glass-panel-dark rounded-xl px-4 py-3 border border-slate-800/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-300 tracking-wide">CUSTOMER PROTECTION</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-mono">Wrongful Freezes Avoided:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">83%</span>
          </div>
        </div>
      </motion.div>

      {/* Main Content - Centered Layout */}
      <div className="h-full w-full flex items-center justify-center p-4 pt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl"
        >
          {/* Customer Lookup Card */}
          <div className="glass-panel rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Search className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Customer Lookup & Risk Status</h2>
                <p className="text-xs text-slate-500 font-mono">Search by Account Number or Name</p>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter account number or customer name..."
                className="flex-1 px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700/50 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors text-sm"
              />
              <motion.button
                onClick={handleSearch}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold text-sm transition-all shadow-lg shadow-cyan-500/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Search
              </motion.button>
            </div>
          </div>

          {/* Customer Details */}
          <AnimatePresence mode="wait">
            {selectedCustomer && (
              <motion.div
                key={selectedCustomer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Risk Status Card - Traffic Light Style */}
                <div className={`glass-panel rounded-2xl p-6 border-2 ${getRiskColor(selectedCustomer.riskLevel).border}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${getRiskColor(selectedCustomer.riskLevel).bg}`}>
                        <User className={`w-6 h-6 ${getRiskColor(selectedCustomer.riskLevel).text}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-100">{selectedCustomer.name}</h3>
                        <p className="text-sm text-slate-400 font-mono">{selectedCustomer.accountNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${getRiskColor(selectedCustomer.riskLevel).dot} animate-pulse`} />
                      <span className={`text-sm font-bold ${getRiskColor(selectedCustomer.riskLevel).text}`}>
                        {selectedCustomer.riskLevel} RISK
                      </span>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className={`p-4 rounded-xl ${
                    selectedCustomer.status === 'RESTRICTED' 
                      ? 'bg-amber-950/30 border border-amber-500/30' 
                      : 'bg-emerald-950/30 border border-emerald-500/30'
                  }`}>
                    <div className="flex items-start gap-3">
                      {selectedCustomer.status === 'RESTRICTED' ? (
                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className={`text-sm font-bold mb-2 ${
                          selectedCustomer.status === 'RESTRICTED' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {selectedCustomer.status === 'RESTRICTED' ? 'ACCOUNT RESTRICTED' : 'ACCOUNT ACTIVE'}
                        </h4>
                        {selectedCustomer.reason && (
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {selectedCustomer.reason}
                          </p>
                        )}
                        {selectedCustomer.essentialServicesActive && selectedCustomer.status === 'RESTRICTED' && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400">
                            <CheckCircle className="w-3 h-3" />
                            <span>Essential services remain active (pension, salary credits)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Customer Impact Visibility */}
                  {selectedCustomer.status === 'RESTRICTED' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 grid grid-cols-3 gap-3"
                    >
                      <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30">
                        <span className="text-[10px] text-slate-500 block mb-1">RESTRICTED AMOUNT</span>
                        <span className="text-lg font-bold text-red-400">{formatCurrency(selectedCustomer.restrictedAmount)}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                        <span className="text-[10px] text-slate-500 block mb-1">AVAILABLE BALANCE</span>
                        <span className="text-lg font-bold text-emerald-400">{formatCurrency(selectedCustomer.availableBalance)}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                        <span className="text-[10px] text-slate-500 block mb-1">TOTAL BALANCE</span>
                        <span className="text-lg font-bold text-slate-200">{formatCurrency(selectedCustomer.totalBalance)}</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Account Info */}
                  <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-1">KYC Status</span>
                      <span className="text-emerald-400 font-mono">{selectedCustomer.kycStatus}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Account Age</span>
                      <span className="text-slate-300 font-mono">{selectedCustomer.accountAge}</span>
                    </div>
                  </div>
                </div>

                {/* Document Verification Panel */}
                {selectedCustomer.status === 'RESTRICTED' && (
                  <div className="glass-panel rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <FileText className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-100">Document Verification (KYC)</h3>
                        <p className="text-xs text-slate-500">Upload clarification documents for review</p>
                      </div>
                    </div>

                    {/* Upload Zone */}
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <div className="border-2 border-dashed border-slate-700/50 rounded-xl p-8 text-center hover:border-cyan-500/50 transition-colors bg-slate-900/30">
                        <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <p className="text-sm text-slate-400 mb-1">Drag and drop files here, or click to browse</p>
                        <p className="text-xs text-slate-600">Supported: PDF, JPG, PNG (Max 10MB per file)</p>
                      </div>
                    </div>

                    {/* Uploaded Documents */}
                    {uploadedDocs.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 space-y-2"
                      >
                        <h4 className="text-xs font-bold text-slate-400 mb-2">UPLOADED DOCUMENTS</h4>
                        {uploadedDocs.map((doc, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                            <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-300 truncate">{doc.name}</p>
                              <p className="text-[10px] text-slate-600">{(doc.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* Important Notice */}
                    <div className="mt-4 p-3 rounded-lg bg-blue-950/30 border border-blue-500/30">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-300 leading-relaxed">
                          <strong>Note:</strong> Upload only document type labels (e.g., "Aadhaar Card", "PAN Card"). 
                          Do not upload actual identity documents with personal information.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Escalation Panel */}
                {selectedCustomer.status === 'RESTRICTED' && (
                  <div className="glass-panel rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-100">Request Central Review</h3>
                        <p className="text-xs text-slate-500">Branch managers cannot release funds directly</p>
                      </div>
                    </div>

                    <textarea
                      value={escalationNote}
                      onChange={(e) => setEscalationNote(e.target.value)}
                      placeholder="Describe the customer's situation and reason for escalation..."
                      className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700/50 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors text-sm resize-none"
                      rows={4}
                      disabled={escalationSubmitted}
                    />

                    <motion.button
                      onClick={handleEscalation}
                      disabled={!escalationNote.trim() || escalationSubmitted}
                      className="mt-3 w-full px-6 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      whileHover={{ scale: escalationSubmitted ? 1 : 1.02 }}
                      whileTap={{ scale: escalationSubmitted ? 1 : 0.98 }}
                    >
                      {escalationSubmitted ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Escalation Submitted
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Escalation Request
                        </>
                      )}
                    </motion.button>

                    {escalationSubmitted && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30"
                      >
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-mono">
                            Request forwarded to Central Compliance Team. Expected response: 2-4 hours.
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!selectedCustomer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel rounded-2xl p-12 text-center"
            >
              <Search className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-400 mb-2">Search for a Customer</h3>
              <p className="text-sm text-slate-600">
                Enter an account number or customer name to view their risk status and account details
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default BranchWorkspace
