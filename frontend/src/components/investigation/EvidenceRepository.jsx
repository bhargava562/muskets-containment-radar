import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, File, Trash, ArrowRight, ShieldCheck, Database, Fingerprint, FileSearch, AlertCircle } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'

export default function EvidenceRepository({ nodeId, node }) {
  const { context, refreshContext } = useInvestigation()
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
  const files = context?.evidenceRepository || []

  // Derive system evidence directly from data already on the node —
  // no new fetch, no new backend field, this data already exists.
  const systemEvidence = [
    node?.kyc && {
      label: 'KYC Record',
      detail: `${node.kyc.kycStatus} — ${node.kyc.idType}`,
      icon: FileSearch
    },
    node?.cbs && {
      label: 'Core Banking Summary',
      detail: `${node.cbs.accountType}, opened ${node.cbs.accountOpenDate}`,
      icon: Database
    },
    node?.device && {
      label: 'Device Telemetry',
      detail: node.device.vpnDetected ? 'VPN/mismatch flagged' : 'No anomaly flagged',
      icon: Fingerprint,
      alert: node.device.vpnDetected || node.device.simChanged || node.device.geoVelocityFlag === 'HIGH'
    },
    node?.complaint && {
      label: 'Linked Complaint',
      detail: `${node.complaint.crimeType} — ${node.complaint.complaintId}`,
      icon: AlertCircle,
      alert: true
    },
    (node?.aiAnalysis?.evidence?.length > 0) && {
      label: 'AI Evidence Claims',
      detail: `${node.aiAnalysis.evidence.length} claim(s) from AI Copilot`,
      icon: ShieldCheck
    }
  ].filter(Boolean)

  // Simulated file upload handler
  const handleUpload = async (fileName, fileSize) => {
    setUploading(true)
    try {
      const formData = new FormData()
      // Simulate file upload
      const blob = new Blob(['mock content'], { type: 'text/plain' })
      formData.append('file', blob, fileName)
      formData.append('uploadedBy', 'EMP-902')

      const res = await fetch(`${backendUrl}/api/investigation/${context.caseId}/evidence`, {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) throw new Error('Upload failed')
      await refreshContext()
    } catch (e) {
      console.error(e)
    } finally {
      setUploading(false)
    }
  }

  const triggerMockUpload = () => {
    // Standard mock documents for demo day
    const mockFiles = [
      { name: `KYC_Aadhaar_Mismatch_${nodeId}.pdf`, size: 102400 },
      { name: `CBS_Transaction_Dump_${nodeId}.csv`, size: 245760 },
      { name: `Device_IP_Mismatch_Audit_${nodeId}.log`, size: 12288 },
      { name: `Branch_Verification_Letter_${nodeId}.pdf`, size: 56320 },
      { name: `Customer_Statement_${nodeId}.pdf`, size: 89600 }
    ]
    const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)]
    handleUpload(randomFile.name, randomFile.size)
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-5">
      {/* Section 1: System-Generated Evidence */}
      <div className="space-y-2">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
          SYSTEM-GENERATED
        </span>
        {systemEvidence.length === 0 ? (
          <div className="text-center py-4 border border-slate-900 rounded-xl bg-slate-950/10 text-slate-600 text-[10px] font-mono">
            No system evidence available for this node.
          </div>
        ) : (
          systemEvidence.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                item.alert
                  ? 'border-amber-500/20 bg-amber-500/5'
                  : 'border-slate-900 bg-slate-950/20'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${item.alert ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="text-slate-300">{item.label}</span>
                </div>
                <span className="text-slate-500 text-[10px] ml-2 truncate">{item.detail}</span>
              </div>
            )
          })
        )}

        {/* Clickable AI evidence claims with evidenceId */}
        {node?.aiAnalysis?.evidence?.length > 0 && (
          <div className="mt-2 space-y-1">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
              AI EVIDENCE CLAIMS
            </span>
            {node.aiAnalysis.evidence.map((claim) => (
              <div key={claim.evidenceId || claim.source} className="flex items-center gap-2 p-2 rounded-lg border border-slate-900 bg-slate-950/30 text-xs">
                <span className="font-mono text-cyan-400 text-[10px] font-bold flex-shrink-0">
                  {claim.evidenceId || '—'}
                </span>
                <span className="text-slate-400 truncate flex-1">{claim.derivedFrom}</span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  claim.weight >= 0.9 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  claim.weight >= 0.7 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {(claim.weight * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Officer-Uploaded Evidence */}
      <div className="space-y-2">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
          OFFICER-UPLOADED
        </span>

        {/* Upload Drag/Click Zone */}
        <div 
          onClick={triggerMockUpload}
          className={`border border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
            uploading ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-950/20 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/20'
          }`}
        >
          <div className="space-y-2">
            <Upload className="w-5 h-5 mx-auto text-slate-500 animate-pulse" />
            <div className="text-xs">
              <span className="font-semibold text-cyan-400">Click to upload document</span>
              <p className="text-[10px] text-slate-500 mt-1">PDF, CSV, PNG, LOG up to 10MB</p>
            </div>
          </div>
        </div>

        {/* Evidence List */}
        <div className="space-y-2 max-h-[220px] overflow-y-auto">
          {files.length === 0 ? (
            <div className="text-center py-4 border border-slate-900 rounded-xl bg-slate-950/10 text-slate-600 text-[10px] font-mono">
              No officer-uploaded evidence yet
            </div>
          ) : (
            files.map((file) => (
              <div key={file.evidenceId} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-900 bg-slate-950/40 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <File className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-slate-300 font-semibold truncate text-[11px]">{file.fileName}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{formatSize(file.fileSize)} · Uploaded by {file.uploadedBy}</p>
                  </div>
                </div>
                <ShieldCheck className="w-4 h-4 text-cyan-500/80 flex-shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
