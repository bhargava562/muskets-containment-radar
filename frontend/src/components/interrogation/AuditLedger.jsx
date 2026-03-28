import { useState } from 'react'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, ExternalLink, RefreshCw, Lock, CheckCircle, Copy,
  Shield, Database, Server, Clock, Hash, Check, Loader2, Download
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { exportSARReport } from '../../utils/pdfGenerator'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

const AuditLedger = () => {
  const { auditHash, resetInvestigation, containedNode, caseMetadata, graphData } = useApp()
  const [copied, setCopied] = useState(false)
  const [sarExporting, setSarExporting] = useState(false)
  const [dpipPushing, setDpipPushing] = useState(false)
  const [sarExported, setSarExported] = useState(false)
  const [dpipPushed, setDpipPushed] = useState(false)

  const copyToClipboard = () => {
    if (auditHash) {
      navigator.clipboard.writeText(auditHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleExportSAR = () => {
    setSarExporting(true)
    
    // Simulate processing delay for professional UX
    setTimeout(() => {
      try {
        // Prepare case data for PDF export
        const caseData = {
          case_id: caseMetadata?.case_id || 'FRA-2026-IOB-00847',
          investigation_type: caseMetadata?.investigation_type || 'RAPID_FUND_FRAGMENTATION',
          total_suspected_amount: caseMetadata?.total_suspected_amount || 200000,
          graphData: graphData || { nodes: [], links: [] }
        }

        // Generate PDF
        exportSARReport(caseData, auditHash)
        
        setSarExporting(false)
        setSarExported(true)
      } catch (error) {
        console.error('[MUSKETS] PDF Export Error:', error)
        setSarExporting(false)
        alert('PDF export failed. Please check console for details.')
      }
    }, 1000)
  }

  const handlePushDPIP = () => {
    setDpipPushing(true)
    setTimeout(() => {
      setDpipPushing(false)
      setDpipPushed(true)
    }, 2000)
  }

  const timestamp = new Date().toISOString()

  return (
    <div className="space-y-3">
      {/* Success Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 flex items-center justify-center mb-3 border border-emerald-500/30"
        >
          <CheckCircle className="w-7 h-7 text-emerald-400" />
        </motion.div>
        <h3 className="text-sm font-bold text-emerald-400">CONTAINMENT VERIFIED</h3>
        <p className="text-[10px] text-slate-400 mt-1">Audit trail immutably recorded to WORM storage</p>
      </motion.div>

      {/* WORM Log Entry */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel-dark rounded-lg p-3 border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-slate-900/50"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Database className="w-3 h-3 text-emerald-400" />
          <span className="text-[9px] text-emerald-400 font-mono font-bold">WORM LOG ENTRY</span>
          <span className="ml-auto px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-[8px] text-emerald-400 font-mono">
            IMMUTABLE
          </span>
        </div>

        {/* Terminal-style readout */}
        <div className="bg-slate-950/80 rounded-md p-2 font-mono text-[9px] space-y-1 border border-slate-700/50">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="text-slate-500">$</span>
            <span className="truncate">audit_log --write --case {caseMetadata?.case_id || 'FRA-2026-IOB-00847'}</span>
          </div>
          <div className="text-slate-400 pl-3">
            <span className="text-emerald-400">✓</span> Evidence chain validated
          </div>
          <div className="text-slate-400 pl-3">
            <span className="text-emerald-400">✓</span> Containment action recorded
          </div>
          <div className="text-slate-400 pl-3">
            <span className="text-emerald-400">✓</span> Hash computed and sealed
          </div>
          <div className="text-emerald-400 pl-3 text-[8px]">
            [SUCCESS] Log entry committed
          </div>
        </div>
      </motion.div>

      {/* XAI Trace Hash */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel-dark rounded-lg p-3 border border-cyan-500/20"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Hash className="w-3 h-3 text-cyan-400" />
            <span className="text-[9px] text-cyan-400 font-mono font-bold">SHA-256 HASH</span>
          </div>
          <motion.button
            onClick={copyToClipboard}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {copied ? (
              <React.Fragment key="copied">
                <Check className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[8px] text-emerald-400">Copied!</span>
              </React.Fragment>
            ) : (
              <React.Fragment key="copy">
                <Copy className="w-2.5 h-2.5" />
                <span className="text-[8px]">Copy</span>
              </React.Fragment>
            )}
          </motion.button>
        </div>

        <div className="bg-slate-950/80 rounded-md p-2 font-mono text-[9px] break-all border border-slate-700/50">
          <span className="text-cyan-400">{auditHash || 'GENERATING...'}</span>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-[8px] text-slate-500 font-mono">
          <Clock className="w-2.5 h-2.5" />
          <span className="truncate">{timestamp}</span>
        </div>
      </motion.div>

      {/* Data Security Tags */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap gap-1.5"
      >
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          <Lock className="w-2.5 h-2.5 text-emerald-400" />
          <span className="text-[8px] font-mono text-emerald-400">TLS 1.3</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20">
          <Shield className="w-2.5 h-2.5 text-cyan-400" />
          <span className="text-[8px] font-mono text-cyan-400">AES-256</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20">
          <Server className="w-2.5 h-2.5 text-purple-400" />
          <span className="text-[8px] font-mono text-purple-400">WORM</span>
        </div>
      </motion.div>

      {/* Contained Node Summary */}
      {containedNode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-panel-dark rounded-lg p-3"
        >
          <h4 className="text-[9px] text-slate-500 font-mono mb-2 flex items-center gap-1.5">
            <Shield className="w-2.5 h-2.5" />
            CONTAINMENT SUMMARY
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
            <div className="p-2 rounded-md bg-slate-800/50">
              <span className="text-slate-500 block mb-0.5 text-[8px]">NODE ID</span>
              <span className="text-cyan-400 font-semibold truncate block">{containedNode.id}</span>
            </div>
            <div className="p-2 rounded-md bg-slate-800/50">
              <span className="text-slate-500 block mb-0.5 text-[8px]">TYPE</span>
              <span className="text-slate-300">{containedNode.type?.toUpperCase()}</span>
            </div>
            <div className="p-2 rounded-md bg-cyan-950/30 border border-cyan-500/20">
              <span className="text-slate-500 block mb-0.5 text-[8px]">STATUS</span>
              <span className="text-cyan-400 font-semibold">FROZEN</span>
            </div>
            <div className="p-2 rounded-md bg-slate-800/50">
              <span className="text-slate-500 block mb-0.5 text-[8px]">HOLD AMT</span>
              <span className="text-emerald-400 font-semibold text-[10px]">
                {formatCurrency(containedNode.received_amount || containedNode.traced_funds || 50000)}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Export Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-2"
      >
        <motion.button
          onClick={handleExportSAR}
          disabled={sarExporting || sarExported}
          className={`w-full py-2.5 px-3 rounded-lg border transition-all flex items-center justify-center gap-2
            ${sarExported
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default'
              : sarExporting
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 cursor-wait'
              : 'glass-panel border-slate-600/50 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 cursor-pointer'
            }`}
          whileHover={!sarExporting && !sarExported ? { scale: 1.01 } : {}}
          whileTap={!sarExporting && !sarExported ? { scale: 0.99 } : {}}
        >
          {sarExporting ? (
            <React.Fragment key="sar-exporting">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="font-semibold text-[10px]">GENERATING PDF...</span>
            </React.Fragment>
          ) : sarExported ? (
            <React.Fragment key="sar-exported">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="font-semibold text-[10px]">SAR EXPORTED</span>
              <Download className="w-3 h-3 ml-1" />
            </React.Fragment>
          ) : (
            <React.Fragment key="sar-default">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-semibold text-[10px]">EXPORT REGULATORY SAR REPORT</span>
            </React.Fragment>
          )}
        </motion.button>

        <motion.button
          onClick={handlePushDPIP}
          disabled={dpipPushing || dpipPushed}
          className={`w-full py-2.5 px-3 rounded-lg border transition-all flex items-center justify-center gap-2
            ${dpipPushed
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              : 'glass-panel border-slate-600/50 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400'
            }`}
          whileHover={!dpipPushing && !dpipPushed ? { scale: 1.01 } : {}}
          whileTap={!dpipPushing && !dpipPushed ? { scale: 0.99 } : {}}
        >
          {dpipPushing ? (
            <React.Fragment key="dpip-pushing">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="font-semibold text-[10px]">PUSHING TO DPIP...</span>
            </React.Fragment>
          ) : dpipPushed ? (
            <React.Fragment key="dpip-pushed">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="font-semibold text-[10px]">PUSHED TO DPIP</span>
            </React.Fragment>
          ) : (
            <React.Fragment key="dpip-default">
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="font-semibold text-[10px]">PUSH TO DPIP NETWORK</span>
            </React.Fragment>
          )}
        </motion.button>
      </motion.div>

      {/* Reset Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="pt-2 border-t border-slate-700/50"
      >
        <motion.button
          onClick={resetInvestigation}
          className="w-full py-2 px-3 rounded-lg text-[10px] text-slate-400 hover:text-slate-200
                     flex items-center justify-center gap-1.5 transition-colors
                     hover:bg-slate-800/50"
          whileHover={{ scale: 1.01 }}
        >
          <RefreshCw className="w-3 h-3" />
          CLOSE CASE & RESUME MONITORING
        </motion.button>
      </motion.div>
    </div>
  )
}

export default AuditLedger