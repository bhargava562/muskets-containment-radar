import { UserCheck, Shield, FileText, MapPin } from 'lucide-react'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const VictimMetrics = ({ node }) => {
  const aiReasoning = node.ai_reasoning || {}

  return (
    <div className="space-y-3">
      {/* Victim Status */}
      <div className="glass-panel-dark rounded-lg p-3 border-l-2 border-blue-500">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-blue-500/20">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[10px] font-bold text-blue-400 tracking-wide">CONFIRMED VICTIM</h3>
            <p className="text-[8px] text-slate-500 font-mono">Protected under PMLA Section 12AA</p>
          </div>
        </div>

        <div className="space-y-1.5 font-mono text-[9px]">
          <div className="flex justify-between items-center p-1.5 rounded-md bg-slate-800/50">
            <span className="text-slate-500">NAME</span>
            <span className="text-blue-400 font-semibold truncate ml-2">{node.account_holder}</span>
          </div>
          <div className="flex justify-between items-center p-1.5 rounded-md bg-slate-800/50">
            <span className="text-slate-500">ACCOUNT</span>
            <span className="text-slate-300 truncate ml-2">{node.account_number}</span>
          </div>
          <div className="flex justify-between items-center p-1.5 rounded-md bg-slate-800/50">
            <span className="text-slate-500">IFSC</span>
            <span className="text-slate-300 truncate ml-2">{node.ifsc_code}</span>
          </div>
          <div className="flex justify-between items-center p-1.5 rounded-md bg-slate-800/50">
            <span className="text-slate-500">BRANCH</span>
            <span className="text-slate-400 text-[8px] truncate ml-2">{node.branch}</span>
          </div>
        </div>
      </div>

      {/* Balance Info */}
      <div className="glass-panel-dark rounded-lg p-3">
        <h3 className="text-[9px] text-slate-500 mb-2 font-mono flex items-center gap-1.5">
          <Shield className="w-3 h-3" />
          FINANCIAL IMPACT
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-md bg-slate-800/50 text-center">
            <span className="text-[8px] text-slate-500 block mb-0.5">CURRENT BALANCE</span>
            <span className="text-sm font-bold text-emerald-400">{formatCurrency(node.balance)}</span>
          </div>
          <div className="p-2 rounded-md bg-red-950/30 border border-red-500/20 text-center">
            <span className="text-[8px] text-slate-500 block mb-0.5">AMOUNT LOST</span>
            <span className="text-sm font-bold text-red-400">{formatCurrency(200000)}</span>
          </div>
        </div>
      </div>

      {/* AI Evidence */}
      {aiReasoning.evidence && (
        <div className="glass-panel-dark rounded-lg p-3">
          <h3 className="text-[9px] text-slate-500 mb-2 font-mono flex items-center gap-1.5">
            <FileText className="w-3 h-3" />
            AI VERIFICATION EVIDENCE
          </h3>
          <div className="space-y-1.5">
            {aiReasoning.evidence.map((evidence, idx) => (
              <div
                key={idx}
                className="flex items-start gap-1.5 p-1.5 rounded-md bg-blue-950/20 border border-blue-500/10"
              >
                <span className="text-blue-400 mt-0.5 text-[10px] flex-shrink-0">✓</span>
                <span className="text-[10px] text-slate-300 break-words">{evidence}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-slate-500">AI Confidence:</span>
              <span className="font-mono text-blue-400 font-semibold">
                {((aiReasoning.confidence || 0.99) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Protected Status */}
      <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Shield className="w-3 h-3 text-blue-400" />
        <span className="text-[10px] font-mono text-blue-400">
          PROTECTED ENTITY - NO ACTION REQUIRED
        </span>
      </div>
    </div>
  )
}

export default VictimMetrics
