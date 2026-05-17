import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react'
import { useApp, CASE_STATUS } from '../../context/AppContextSimplified'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const getPriorityIcon = (priority) => {
  switch (priority) {
    case 'P1': return AlertOctagon
    case 'P2': return AlertTriangle
    case 'P3': return AlertCircle
    default: return AlertTriangle
  }
}

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'P1': return 'border-red-500 bg-red-50'
    case 'P2': return 'border-amber-500 bg-amber-50'
    case 'P3': return 'border-blue-500 bg-blue-50'
    default: return 'border-slate-500 bg-slate-50'
  }
}

const InvestigationQueue = () => {
  const { cases, getCasesByStatus, setSelectedCaseId, selectedCaseId } = useApp()

  const pendingCases = getCasesByStatus(CASE_STATUS.PENDING_TRIAGE)

  // Group by priority
  const p1Cases = pendingCases.filter(c => c.priority === 'P1')
  const p2Cases = pendingCases.filter(c => c.priority === 'P2')
  const p3Cases = pendingCases.filter(c => c.priority === 'P3')

  const CaseCard = ({ caseData }) => {
    const PriorityIcon = getPriorityIcon(caseData.priority)
    const isSelected = selectedCaseId === caseData.id

    return (
      <motion.button
        onClick={() => setSelectedCaseId(caseData.id)}
        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${getPriorityColor(caseData.priority)} ${
          isSelected ? 'ring-2 ring-offset-2 ring-slate-400' : 'hover:shadow-md'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-start gap-2">
          <PriorityIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-xs font-bold opacity-60">{caseData.id}</div>
            <div className="text-sm font-semibold mt-1 line-clamp-2">{caseData.summary}</div>
            <div className="text-xs opacity-70 mt-2 flex gap-2">
              <span>{formatCurrency(caseData.riskAmount)}</span>
            </div>
          </div>
        </div>
      </motion.button>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white rounded-lg border">
      <div className="px-4 py-3 border-b bg-slate-50">
        <h2 className="text-sm font-bold text-slate-900">TRIAGE QUEUE</h2>
        <p className="text-xs text-slate-600 mt-1">{pendingCases.length} pending</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        <AnimatePresence>
          {pendingCases.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              <p className="text-sm">No pending cases</p>
            </div>
          ) : (
            <>
              {p1Cases.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-red-700 mb-2">CRITICAL (P1)</div>
                  <div className="space-y-2">
                    {p1Cases.map(caseData => (
                      <CaseCard key={caseData.id} caseData={caseData} />
                    ))}
                  </div>
                </div>
              )}

              {p2Cases.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-amber-700 mb-2">HIGH (P2)</div>
                  <div className="space-y-2">
                    {p2Cases.map(caseData => (
                      <CaseCard key={caseData.id} caseData={caseData} />
                    ))}
                  </div>
                </div>
              )}

              {p3Cases.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-blue-700 mb-2">MEDIUM (P3)</div>
                  <div className="space-y-2">
                    {p3Cases.map(caseData => (
                      <CaseCard key={caseData.id} caseData={caseData} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default InvestigationQueue
