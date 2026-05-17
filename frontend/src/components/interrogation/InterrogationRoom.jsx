import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, AlertTriangle, Building2, ShieldAlert, ShieldCheck, UserCheck, Scale, FileText, Briefcase, Download, CheckCircle2, Clock, Shield, XCircle } from 'lucide-react'
import { useApp, APP_STATES } from '../../context/AppContext'
import MuleMetrics from './MuleMetrics'
import MerchantMetrics from './MerchantMetrics'
import VictimMetrics from './VictimMetrics'
import AuditLedger from './AuditLedger'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const InterrogationRoom = () => {
  const { selectedNode, appState, closePanel, containedNode, frozenNodes, graphData, caseMetadata, deployNetworkContainment } = useApp()
  const [showEvidenceTab, setShowEvidenceTab] = useState(false)
  const [exportStatus, setExportStatus] = useState(null)

  // Determine which view to show
  const showAuditLedger = appState === APP_STATES.AUDIT_LOGGED
  const showContainmentConfirm = appState === APP_STATES.CONTAINED

  // Get the node to display (either selected or the one that was just contained)
  const displayNode = selectedNode || containedNode
  const isFrozen = displayNode && frozenNodes.includes(displayNode.id)

  // Generate auto-drafted reasoning
  const generateInvestigatorReasoning = (node) => {
    if (!node) return ''
    
    if (node.type === 'mule') {
      const velocity = node.velocity || 14
      const fr = node.fragmentation_ratio || 4.2
      const dwellTime = node.ai_reasoning?.primary_evidence?.dwell_time || '33 seconds'
      
      return `Funds dispersed across ${Math.round(fr)} downstream nodes within ${dwellTime}. Velocity of ${velocity} tx/min exceeds normal threshold by 28x. Device mismatch and VPN login detected. Full freeze recommended to prevent further fund movement. Account holder likely victim of credential theft - investigation required to determine if willing participant.`
    }
    
    if (node.type === 'merchant') {
      const tracedFunds = node.traced_funds || 50000
      const balance = node.current_balance || 3145000
      const pct = ((tracedFunds / balance) * 100).toFixed(1)
      
      return `Partial lien recommended to minimize innocent customer impact while securing ${formatCurrency(tracedFunds)}. Traced stolen funds represent only ${pct}% of total account balance. Full freeze would disrupt legitimate business operations. GST-verified merchant with no prior fraud history. Proportional hold preserves business continuity while ensuring fund recovery.`
    }
    
    return 'Investigation in progress. Awaiting additional telemetry data.'
  }

  // Calculate Customer Impact Score
  const calculateImpactScore = (node) => {
    if (!node) return { level: 'UNKNOWN', color: 'slate', description: 'No data' }
    
    if (node.type === 'mule') {
      return { 
        level: 'MEDIUM', 
        color: 'amber', 
        description: 'Account holder may be innocent victim of credential theft'
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
          description: `Only ${pct.toFixed(1)}% of balance affected - business operations unaffected`
        }
      } else if (pct < 15) {
        return { 
          level: 'MEDIUM', 
          color: 'amber', 
          description: `${pct.toFixed(1)}% of balance affected - moderate business impact`
        }
      } else {
        return { 
          level: 'HIGH', 
          color: 'red', 
          description: `${pct.toFixed(1)}% of balance affected - significant business disruption`
        }
      }
    }
    
    return { level: 'LOW', color: 'emerald', description: 'Protected entity' }
  }

  // Export handlers
  const handleInterbankExport = () => {
    setExportStatus('interbank')
    
    // Simulate PDF generation
    setTimeout(() => {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('INTERBANK FREEZE PACKET', 20, 20)
      doc.setFontSize(10)
      doc.text(`Case ID: ${caseMetadata?.case_id || 'N/A'}`, 20, 35)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42)
      doc.text('Contains: Complaint ID, Trace Graph, Risk Score, Account Details', 20, 55)
      doc.save(`Interbank_Freeze_${caseMetadata?.case_id || 'CASE'}.pdf`)
      
      setTimeout(() => setExportStatus(null), 2000)
    }, 500)
  }

  const handleFIRExport = () => {
    setExportStatus('fir')
    
    // Simulate PDF generation
    setTimeout(() => {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('FIR EVIDENCE BUNDLE', 20, 20)
      doc.setFontSize(10)
      doc.text(`Case ID: ${caseMetadata?.case_id || 'N/A'}`, 20, 35)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42)
      doc.text('Audit-ready PDF for Cybercell - Section 63 BSA Compliant', 20, 55)
      doc.save(`FIR_Evidence_${caseMetadata?.case_id || 'CASE'}.pdf`)
      
      setTimeout(() => setExportStatus(null), 2000)
    }, 500)
  }

  // Timeline events
  const timelineEvents = [
    { time: '14:02:11', event: 'Alert generated by ML', icon: AlertTriangle, color: 'red' },
    { time: '14:02:15', event: '3-Hop Trace completed', icon: CheckCircle2, color: 'cyan' },
    { time: '14:04:10', event: 'Partial lien approved by Investigator', icon: Shield, color: 'emerald' }
  ]

  const impactScore = calculateImpactScore(displayNode)
  const autoReasoning = generateInvestigatorReasoning(displayNode)

  if (!displayNode && !showAuditLedger && !showContainmentConfirm) {
    return null
  }

  const getNodeConfig = () => {
    if (!displayNode) return { icon: User, color: 'slate', label: 'NODE METRICS', badge: null }

    switch (displayNode.type) {
      case 'mule':
        return {
          icon: AlertTriangle,
          color: 'red',
          label: 'CONTAINMENT ORCHESTRATION',
          badge: { text: 'ACTIVE MULE', bg: 'bg-red-500/20', border: 'border-red-500/40', textColor: 'text-red-400' }
        }
      case 'merchant':
        return {
          icon: Building2,
          color: 'amber',
          label: 'CONTAINMENT ORCHESTRATION',
          badge: { text: 'PASSIVE INNOCENT', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', textColor: 'text-emerald-400' }
        }
      case 'victim':
        return {
          icon: UserCheck,
          color: 'blue',
          label: 'VICTIM PROFILE',
          badge: { text: 'PROTECTED ENTITY', bg: 'bg-blue-500/20', border: 'border-blue-500/40', textColor: 'text-blue-400' }
        }
      default:
        return { icon: User, color: 'slate', label: 'NODE METRICS', badge: null }
    }
  }

  const nodeConfig = getNodeConfig()
  const NodeIcon = nodeConfig.icon

  const iconColorClass = {
    red: 'text-red-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    slate: 'text-slate-400'
  }[nodeConfig.color]

  const iconBgClass = {
    red: 'bg-red-500/20',
    amber: 'bg-amber-500/20',
    blue: 'bg-blue-500/20',
    slate: 'bg-slate-500/20'
  }[nodeConfig.color]

  return (
    <div className="h-full glass-panel rounded-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-slate-700/50">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${iconBgClass}`}>
              {showAuditLedger ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : isFrozen ? (
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
              ) : (
                <NodeIcon className={`w-4 h-4 ${iconColorClass}`} />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-slate-100 tracking-wide truncate">
                {showAuditLedger ? 'EVIDENCE LEDGER' : nodeConfig.label}
              </h2>
              {displayNode && (
                <p className="text-[10px] font-mono text-slate-500 truncate">
                  NODE: <span className="text-cyan-400">{displayNode.id}</span>
                </p>
              )}
            </div>
          </div>
          <motion.button
            onClick={closePanel}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* Classification Badge */}
        {displayNode && nodeConfig.badge && !showAuditLedger && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${nodeConfig.badge.bg} border ${nodeConfig.badge.border}`}
          >
            {displayNode.type === 'mule' ? (
              <span className="text-xs">🚨</span>
            ) : displayNode.type === 'merchant' ? (
              <span className="text-xs">🟢</span>
            ) : (
              <span className="text-xs">🔵</span>
            )}
            <span className={`text-[10px] font-bold font-mono ${nodeConfig.badge.textColor}`}>
              {isFrozen ? 'FROZEN - ' : ''}{nodeConfig.badge.text}
            </span>
          </motion.div>
        )}

        {/* Frozen Status */}
        {isFrozen && !showAuditLedger && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30"
          >
            <ShieldAlert className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-mono text-cyan-400">CONTAINMENT ACTIVE</span>
          </motion.div>
        )}

        {/* Tab Navigation for Evidence & Recovery */}
        {(appState === APP_STATES.INVESTIGATING || appState === APP_STATES.CONTAINED || appState === APP_STATES.AUDIT_LOGGED) && displayNode && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setShowEvidenceTab(false)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                !showEvidenceTab
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-700/50 hover:text-slate-300'
              }`}
            >
              CONTAINMENT
            </button>
            <button
              onClick={() => setShowEvidenceTab(true)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                showEvidenceTab
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-700/50 hover:text-slate-300'
              }`}
            >
              EVIDENCE & RECOVERY
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          {showAuditLedger ? (
            <motion.div
              key="audit-ledger"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AuditLedger />
            </motion.div>
          ) : showEvidenceTab ? (
            <motion.div
              key="evidence-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Timeline View */}
              <div className="glass-panel-dark rounded-lg p-4 border border-slate-700/50">
                <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  INVESTIGATION TIMELINE
                </h3>
                <div className="space-y-3">
                  {timelineEvents.map((event, idx) => (
                    <motion.div
                      key={`timeline-${idx}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className={`p-1.5 rounded-lg bg-${event.color}-500/20 flex-shrink-0`}>
                        <event.icon className={`w-3 h-3 text-${event.color}-400`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300">{event.event}</p>
                        <span className="text-[10px] text-slate-500 font-mono">{event.time}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Export Actions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 mb-2">LEGAL & INTER-BANK EXPORT</h3>
                
                {/* Interbank Freeze Packet */}
                <motion.button
                  onClick={handleInterbankExport}
                  disabled={exportStatus === 'interbank'}
                  className="w-full glass-panel-dark rounded-lg p-4 border border-slate-700/50 hover:border-cyan-500/40 transition-all text-left group disabled:opacity-50"
                  whileHover={{ scale: exportStatus ? 1 : 1.02 }}
                  whileTap={{ scale: exportStatus ? 1 : 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                      <FileText className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-200 mb-1">Generate Interbank Freeze Packet</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Contains: Complaint ID, Trace Graph, Risk Score, Account Details for cross-bank coordination
                      </p>
                      {exportStatus === 'interbank' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 mt-2 text-emerald-400"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-xs font-mono">Exported successfully</span>
                        </motion.div>
                      )}
                    </div>
                    <Download className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </motion.button>

                {/* FIR Evidence Bundle */}
                <motion.button
                  onClick={handleFIRExport}
                  disabled={exportStatus === 'fir'}
                  className="w-full glass-panel-dark rounded-lg p-4 border border-slate-700/50 hover:border-amber-500/40 transition-all text-left group disabled:opacity-50"
                  whileHover={{ scale: exportStatus ? 1 : 1.02 }}
                  whileTap={{ scale: exportStatus ? 1 : 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                      <Briefcase className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-200 mb-1">Export FIR Evidence Bundle</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Audit-ready PDF for Cybercell - Section 63 BSA compliant with primary evidence ledger
                      </p>
                      {exportStatus === 'fir' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 mt-2 text-emerald-400"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-xs font-mono">Exported successfully</span>
                        </motion.div>
                      )}
                    </div>
                    <Download className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="containment-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Anchor Effect - Option Comparison (Only for non-frozen nodes) */}
              {displayNode && !isFrozen && appState === APP_STATES.INVESTIGATING && (displayNode.type === 'mule' || displayNode.type === 'merchant') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel-dark rounded-lg p-4 border border-slate-700/50"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Scale className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-cyan-400 font-mono tracking-wider">CONTAINMENT OPTIONS</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Option A - Full Freeze (Harsh) */}
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg blur opacity-75" />
                      <div className="relative bg-gradient-to-br from-red-950/40 to-red-900/20 border border-red-500/40 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-bold text-red-400">OPTION A: FULL FREEZE</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-1.5">
                            <span className="text-red-400 text-xs mt-0.5">×</span>
                            <span className="text-[10px] text-slate-300">Blocks pension auto-debit</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-red-400 text-xs mt-0.5">×</span>
                            <span className="text-[10px] text-slate-300">Stops EMI payments</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-red-400 text-xs mt-0.5">×</span>
                            <span className="text-[10px] text-slate-300">High merchant disruption</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-red-400 text-xs mt-0.5">×</span>
                            <span className="text-[10px] text-slate-300">Lawsuit risk: HIGH</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Option B - Proportional Lien (Recommended) */}
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 rounded-lg blur opacity-75 animate-pulse" />
                      <div className="relative bg-gradient-to-br from-cyan-950/40 to-emerald-900/20 border-2 border-cyan-500/60 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-400">OPTION B: PROPORTIONAL LIEN ✓</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-1.5">
                            <span className="text-emerald-400 text-xs mt-0.5">✓</span>
                            <span className="text-[10px] text-slate-300">Freeze only traced amount</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-emerald-400 text-xs mt-0.5">✓</span>
                            <span className="text-[10px] text-slate-300">Account remains active</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-emerald-400 text-xs mt-0.5">✓</span>
                            <span className="text-[10px] text-slate-300">Zero EMI disruption</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-emerald-400 text-xs mt-0.5">✓</span>
                            <span className="text-[10px] text-slate-300">Lawsuit risk: MINIMAL</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-emerald-500/20">
                          <span className="text-[9px] text-emerald-400 font-mono font-bold">RECOMMENDED</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Impact Score */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">COLLATERAL DAMAGE RISK:</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full bg-${impactScore.color}-500/20 text-${impactScore.color}-400 border border-${impactScore.color}-500/40`}>
                        {impactScore.level}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{impactScore.description}</p>
                  </motion.div>
                </motion.div>
              )}

              {/* Auto-Drafted Reasoning */}
              {displayNode && !isFrozen && appState === APP_STATES.INVESTIGATING && autoReasoning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-panel-dark rounded-lg p-4 border border-slate-700/50"
                >
                  <h3 className="text-xs font-bold text-slate-300 mb-2">AUTO-DRAFTED JUSTIFICATION</h3>
                  <textarea
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-xs text-slate-300 font-mono leading-relaxed resize-none focus:outline-none focus:border-cyan-500/50 transition-colors"
                    rows={6}
                    defaultValue={autoReasoning}
                  />
                  <p className="text-[9px] text-slate-500 mt-2">
                    ✓ Pre-filled reasoning ready for investigator review and approval
                  </p>
                </motion.div>
              )}

              {/* Node Metrics */}
              {showContainmentConfirm ? (
                <div className="space-y-4">
                  {displayNode?.type === 'mule' ? (
                    <MuleMetrics node={displayNode} isContained={true} />
                  ) : displayNode?.type === 'merchant' ? (
                    <MerchantMetrics node={displayNode} isContained={true} />
                  ) : null}
                </div>
              ) : displayNode?.type === 'mule' ? (
                <MuleMetrics node={displayNode} />
              ) : displayNode?.type === 'merchant' ? (
                <MerchantMetrics node={displayNode} />
              ) : displayNode?.type === 'victim' ? (
                <VictimMetrics node={displayNode} />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default InterrogationRoom
