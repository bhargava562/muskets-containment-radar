import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { useApp, CASE_STATUS } from '../../context/AppContextSimplified'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const ContainmentActionPanel = () => {
  const { getSelectedCase, approveContainment } = useApp()
  const caseData = getSelectedCase()

  if (!caseData) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-lg border">
        <p className="text-sm text-slate-500">Select a case to review</p>
      </div>
    )
  }

  const handleApprove = () => {
    approveContainment(caseData.id)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white rounded-lg border">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-slate-50">
        <h2 className="text-sm font-bold text-slate-900">CONTAINMENT REVIEW</h2>
        <p className="text-xs text-slate-600 mt-1">{caseData.id}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Case Summary */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-900">INCIDENT SUMMARY</h3>
          <p className="text-sm text-slate-700">{caseData.summary}</p>
        </div>

        {/* Amount Breakdown */}
        <div className="space-y-2 bg-slate-50 p-3 rounded">
          <h3 className="text-xs font-bold text-slate-900">FINANCIAL IMPACT</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Risk Amount:</span>
              <span className="font-mono font-bold">{formatCurrency(caseData.riskAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Recoverable:</span>
              <span className="font-mono font-bold text-emerald-600">{formatCurrency(caseData.recoverableAmount)}</span>
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Recovery Rate: {((caseData.recoverableAmount / caseData.riskAmount) * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="space-y-2 bg-blue-50 p-3 rounded border border-blue-200">
          <h3 className="text-xs font-bold text-slate-900">ACCOUNT NETWORK</h3>
          <div className="space-y-1 text-xs text-slate-700">
            <div><span className="font-semibold">Victim:</span> {caseData.victimAccount}</div>
            <div><span className="font-semibold">Mules ({caseData.muleAccounts.length}):</span> {caseData.muleAccounts.slice(0, 2).join(', ')}</div>
            <div><span className="font-semibold">Merchants ({caseData.merchantAccounts.length}):</span> {caseData.merchantAccounts.join(', ')}</div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="space-y-3 bg-amber-50 p-3 rounded border border-amber-200">
          <div className="flex gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-slate-900">RECOMMENDED ACTION</h3>
              <p className="text-sm text-slate-700 mt-2">
                <span className="font-semibold">PARTIAL LIEN</span> (Proportional Hold)
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Freezes traced funds ({formatCurrency(caseData.recoverableAmount)}) across the network without disrupting innocent merchant operations. Minimizes collateral impact while securing evidence.
              </p>
            </div>
          </div>
        </div>

        {/* Customer Impact Score */}
        <div className="space-y-2 bg-emerald-50 p-3 rounded border border-emerald-200">
          <h3 className="text-xs font-bold text-slate-900">IMPACT ASSESSMENT</h3>
          <p className="text-sm text-slate-700">
            <span className="font-semibold">LOW COLLATERAL DAMAGE</span>
          </p>
          <p className="text-xs text-slate-600">
            Partial hold affects {((caseData.recoverableAmount / (caseData.recoverableAmount + 500000)) * 100).toFixed(1)}% of network liquidity. Essential services remain active.
          </p>
        </div>
      </div>

      {/* Footer - Action Buttons */}
      <div className="border-t bg-slate-50 p-4 space-y-2">
        <motion.button
          onClick={handleApprove}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors text-sm"
        >
          <CheckCircle2 className="w-4 h-4 inline mr-2" />
          APPROVE PARTIAL HOLD
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm"
        >
          <XCircle className="w-4 h-4 inline mr-2" />
          Defer Decision
        </motion.button>
      </div>
    </div>
  )
}

export default ContainmentActionPanel
