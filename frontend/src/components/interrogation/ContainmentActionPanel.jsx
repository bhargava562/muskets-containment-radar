import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Building2, UserCheck, ShieldAlert, ShieldCheck, Scale, CheckCircle2, XCircle, Clock, FileText, Download, Briefcase } from 'lucide-react'
import { useApp, APP_STATES } from '../../context/AppContext'
import jsPDF from 'jspdf'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const ContainmentActionPanel = () => {
  const { selectedNode, appState, closePanel, containedNode, frozenNodes, caseMetadata, deployNetworkContainment } = useApp()
  const [showEvidenceTab, setShowEvidenceTab] = useState(false)
  const [exportStatus, setExportStatus] = useState(null)
  const [justification, setJustification] = useState('')

  const displayNode = selectedNode || containedNode
  const isFrozen = displayNode && frozenNodes.includes(displayNode.id)

  // Auto-drafted reasoning
  const generateJustification = (node) => {
    if (!node) return ''
    
    if (node.type === 'mule') {
      return `High-velocity fund dispersal detected across multiple downstream nodes. Device mismatch and VPN login indicate credential compromise. Full freeze recommended to prevent further movement. Account holder likely victim of credential theft - investigation required.`
    }
    
    if (node.type === 'merchant') {
      const tracedFunds = node.traced_funds || 50000
      const balance = node.current_balance || 3145000
      const pct = ((tracedFunds / balance) * 100).toFixed(1)
      
      return `Proportional lien recommended to minimize innocent customer impact while securing ${formatCurrency(tracedFunds)}. Traced funds represent only ${pct}% of total balance. Full freeze would disrupt legitimate business operations. GST-verified merchant with no prior fraud history.`
    }
    
    return 'Investigation in progress.'
  }

  // Customer Impact Score
  const calculateImpactScore = (node) => {
    if (!node) return { level: 'UNKNOWN', color: 'slate', description: 'No data' }
    
    if (node.type === 'mule') {
      return { 
        level: 'MEDIUM', 
        color: 'amber', 
        description: 'Account holder may be innocent victim'
      }
    }
    
    if (node.type === 'merchant') {
      const tracedFunds = node.traced_funds || 50000
      const balance = node.current_balance || 3145000
      const pct = (tracedFunds / balance) * 100
      
      if (pct < 5) {
        return { 
          level: 'LOW', 
          color: 'emerald', 
          description: `Only ${pct.toFixed(1)}% of balance affected`
        }
      } else if (pct < 15) {
        return { 
          level: 'MEDIUM', 
          color: 'amber', 
          description: `${pct.toFixed(1)}% of balance affected`
        }
      } else {
        return { 
          level: 'HIGH', 
          color: 'red', 
          description: `${pct.toFixed(1)}% of balance affected`
        }
      }
    }
    
    return { level: 'LOW', color: 'emerald', description: 'Protected entity' }
  }

  // Historical Context
  const getHistoricalContext = (node) => {
    if (!node) return []
    
    if (node.type === 'merchant') {
      return [
        '4 years low-risk activity',
        'No prior fraud linkage',
        'GST-verified business entity',
        'Regular transaction pattern'
      ]
    }
    
    if (node.type === 'mule') {
      return [
        'First-time occurrence',
        'Device mismatch detected',
        'VPN/TOR login flagged',
        'Credential theft suspected'
      ]
    }
    
    return []
  }

  // Export handlers
  const handleInterbankExport = () => {
    setExportStatus('interbank')
    setTimeout(() => {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('INTERBANK FREEZE PACKET', 20, 20)
      doc.setFontSize(10)
      doc.text(`Case ID: ${caseMetadata?.case_id || 'N/A'}`, 20, 35)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42)
      doc.save(`Interbank_Freeze_${caseMetadata?.case_id || 'CASE'}.pdf`)
      setTimeout(() => setExportStatus(null), 2000)
    }, 500)
  }

  const handleFIRExport = () => {
    setExportStatus('fir')
    setTimeout(() => {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('FIR EVIDENCE BUNDLE', 20, 20)
      doc.setFontSize(10)
      doc.text(`Case ID: ${caseMetadata?.case_id || 'N/A'}`, 20, 35)
      doc.save(`FIR_Evidence_${caseMetadata?.case_id || 'CASE'}.pdf`)
      setTimeout(() => setExportStatus(null), 2000)
    }, 500)
  }

  const timelineEvents = [
    { time: '14:02:11', event: 'Alert generated', icon: AlertTriangle, color: 'red' },
    { time: '14:02:15', event: '3-Hop trace completed', icon: CheckCircle2, color: 'cyan' },
    { time: '14:04:10', event: 'Lien approved', icon: ShieldCheck, color: 'emerald' }
  ]

  const impactScore = calculateImpactScore(displayNode)
  const autoJustification = generateJustification(displayNode)
  const historicalContext = getHistoricalContext(displayNode)

  if (!displayNode) return null

  const getNodeConfig = () => {
    switch (displayNode.type) {
      case 'mule':
        return {
          icon: AlertTriangle,
          color: 'red',
          label: 'Containment Action',
          badge: { text: 'ACTIVE MULE', bg: 'bg-red-500/20', border: 'border-red-500/40', textColor: 'text-red-400' }
        }
      case 'merchant':
        return {
          icon: Building2,
          color: 'emerald',
          label: 'Containment Action',
          badge: { text: 'PASSIVE INNOCENT', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', textColor: 'text-emerald-400' }
        }
      case 'victim':
        return {
          icon: UserCheck,
          color: 'blue',
          label: 'Victim Profile',
          badge: { text: 'PROTECTED', bg: 'bg-blue-500/20', border: 'border-blue-500/40', textColor: 'text-blue-400' }
        }
      default:
        return { icon: ShieldAlert, color: 'slate', label: 'Node Review', badge: null }
    }
  }

  const nodeConfig = getNodeConfig()
  const NodeIcon = nodeConfig.icon

  return (
    <div className="h-full glass-panel rounded-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-700/50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${nodeConfig.color}-500/20`}>
              <NodeIcon className={`w-5 h-5 text-${nodeConfig.color}-400`} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">{nodeConfig.label}</h2>
              <p className="text-xs font-mono text-slate-500">NODE: <span className="text-cyan-400">{displayNode.id}</span></p>
            </div>
          </div>
          <motion.button
            onClick={closePanel}
            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {nodeConfig.badge && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${nodeConfig.badge.bg} border ${nodeConfig.badge.border}`}>
            <span className={`text-xs font-bold font-mono ${nodeConfig.badge.textColor}`}>
              {isFrozen ? 'FROZEN - ' : ''}{nodeConfig.badge.text}
            </span>
          </div>
        )}

        {isFrozen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30"
          >
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono text-cyan-400">CONTAINMENT ACTIVE</span>
          </motion.div>
        )}

        {/* Tab Navigation */}
        {appState !== APP_STATES.MONITORING && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setShowEvidenceTab(false)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-mono font-bold transition ${
                !showEvidenceTab
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-700/50 hover:text-slate-300'
              }`}
            >
              CONTAINMENT
            </button>
            <button
              onClick={() => setShowEvidenceTab(true)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-mono font-bold transition ${
                showEvidenceTab
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-700/50 hover:text-slate-300'
              }`}
            >
              EVIDENCE
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="wait">
          {showEvidenceTab ? (
            <motion.div
              key="evidence"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Timeline */}
              <div className="glass-panel-dark rounded-lg p-4 border border-slate-700/50">
                <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  INVESTIGATION TIMELINE
                </h3>
                <div className="space-y-3">
                  {timelineEvents.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg bg-${event.color}-500/20`}>
                        <event.icon className={`w-3 h-3 text-${event.color}-400`} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-300">{event.event}</p>
                        <span className="text-[10px] text-slate-500 font-mono">{event.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Actions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300">EXPORT CENTER</h3>
                
                <motion.button
                  onClick={handleInterbankExport}
                  disabled={exportStatus === 'interbank'}
                  className="w-full glass-panel-dark rounded-lg p-4 border border-slate-700/50 hover:border-cyan-500/40 transition text-left group"
                  whileHover={{ scale: exportStatus ? 1 : 1.02 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <FileText className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-200 mb-1">Interbank Freeze Packet</h4>
                      <p className="text-[10px] text-slate-400">Standardized packet with trace graph and containment reasoning</p>
                      {exportStatus === 'interbank' && (
                        <div className="flex items-center gap-2 mt-2 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-xs font-mono">Exported</span>
                        </div>
                      )}
                    </div>
                    <Download className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                  </div>
                </motion.button>

                <motion.button
                  onClick={handleFIRExport}
                  disabled={exportStatus === 'fir'}
                  className="w-full glass-panel-dark rounded-lg p-4 border border-slate-700/50 hover:border-amber-500/40 transition text-left group"
                  whileHover={{ scale: exportStatus ? 1 : 1.02 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <Briefcase className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-200 mb-1">FIR Evidence Bundle</h4>
                      <p className="text-[10px] text-slate-400">Section 63 BSA compliant evidence packet</p>
                      {exportStatus === 'fir' && (
                        <div className="flex items-center gap-2 mt-2 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-xs font-mono">Exported</span>
                        </div>
                      )}
                    </div>
                    <Download className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                  </div>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="containment"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Option Comparison - Only for non-frozen nodes */}
              {!isFrozen && appState === APP_STATES.INVESTIGATING && (displayNode.type === 'mule' || displayNode.type === 'merchant') && (
                <div className="glass-panel-dark rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Scale className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-cyan-400 font-mono">CUSTOMER IMPACT PREVIEW</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Option A - Full Freeze */}
                    <div className="relative">
                      <div className="absolute -inset-0.5 bg-red-500/20 rounded-lg blur" />
                      <div className="relative bg-red-950/40 border border-red-500/40 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-bold text-red-400">OPTION A</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2">Full Freeze</p>
                        <div className="space-y-1">
                          <div className="flex items-start gap-1.5">
                            <span className="text-red-400 text-xs">×</span>
                            <span className="text-[10px] text-slate-300">Blocks pension, EMI</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-red-400 text-xs">×</span>
                            <span className="text-[10px] text-slate-300">Merchant settlement</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Option B - Partial Lien */}
                    <div className="relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 rounded-lg blur animate-pulse" />
                      <div className="relative bg-cyan-950/40 border-2 border-cyan-500/60 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-400">OPTION B ✓</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2">Partial Lien</p>
                        <div className="space-y-1">
                          <div className="flex items-start gap-1.5">
                            <span className="text-emerald-400 text-xs">✓</span>
                            <span className="text-[10px] text-slate-300">Traced amount only</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-emerald-400 text-xs">✓</span>
                            <span className="text-[10px] text-slate-300">Account active</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-emerald-500/20">
                          <span className="text-[9px] text-emerald-400 font-mono font-bold">RECOMMENDED</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Impact Score */}
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">COLLATERAL DAMAGE:</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full bg-${impactScore.color}-500/20 text-${impactScore.color}-400 border border-${impactScore.color}-500/40`}>
                        {impactScore.level}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{impactScore.description}</p>
                  </div>
                </div>
              )}

              {/* Historical Context */}
              {historicalContext.length > 0 && (
                <div className="glass-panel-dark rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-xs font-bold text-slate-300 mb-3">HISTORICAL CONTEXT</h3>
                  <div className="space-y-2">
                    {historicalContext.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5" />
                        <span className="text-xs text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto-Drafted Justification */}
              {!isFrozen && appState === APP_STATES.INVESTIGATING && autoJustification && (
                <div className="glass-panel-dark rounded-lg p-4 border border-slate-700/50">
                  <h3 className="text-xs font-bold text-slate-300 mb-3">AUTO-DRAFTED JUSTIFICATION</h3>
                  <textarea
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-xs text-slate-300 font-mono leading-relaxed resize-none focus:outline-none focus:border-cyan-500/50 transition"
                    rows={5}
                    value={justification || autoJustification}
                    onChange={(e) => setJustification(e.target.value)}
                  />
                  <p className="text-[9px] text-slate-500 mt-2">
                    ✓ Pre-filled reasoning ready for review
                  </p>
                </div>
              )}

              {/* Approve Action */}
              {!isFrozen && appState === APP_STATES.INVESTIGATING && (displayNode.type === 'mule' || displayNode.type === 'merchant') && (
                <motion.button
                  onClick={deployNetworkContainment}
                  className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm transition shadow-lg shadow-cyan-500/20"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Approve Partial Hold
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ContainmentActionPanel
