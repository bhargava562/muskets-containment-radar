import { useState, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Upload, File, ShieldCheck, Database, Fingerprint, FileSearch, AlertCircle, Calendar, Link2, Info } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'

export default function EvidenceRepository({ nodeId, node }) {
  const { context, refreshContext } = useInvestigation()
  const [uploading, setUploading] = useState(false)

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
  const files = context?.evidenceRepository || []

  const fileInputRef = useRef(null)

  const handleRealUpload = async (files) => {
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('uploadedBy', 'EMP-902')
        const res = await fetch(`${backendUrl}/api/investigation/${context.caseId}/evidence`, {
          method: 'POST',
          body: formData
        })
        if (!res.ok) throw new Error('Upload failed')
      }
      await refreshContext()
    } catch (e) {
      console.error(e)
    } finally {
      setUploading(false)
    }
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Derive timeline of collected evidence
  const evidenceTimeline = useMemo(() => {
    const timeline = []
    if (node?.kyc) {
      timeline.push({ type: 'System', label: 'KYC Record Linked', date: node.kyc.lastVerifiedDate || '2026-01-01' })
    }
    if (node?.cbs) {
      timeline.push({ type: 'System', label: 'CBS Summary Generated', date: node.cbs.accountOpenDate || '2026-01-01' })
    }
    if (node?.complaint) {
      timeline.push({ type: 'Alert', label: '1930 Portal Complaint Linked', date: '2026-07-12' })
    }
    files.forEach(f => {
      timeline.push({ type: 'Officer', label: `Dossier: ${f.fileName}`, date: '2026-07-13' })
    })
    return timeline
  }, [node, files])

  return (
    <div className="space-y-6 text-slate-200">
      {/* SECTION 1: AI Evidence Provenance Claims */}
      {node?.aiAnalysis?.evidence?.length > 0 && (
        <div className="space-y-2">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
            AI Evidence Provenance
          </span>
          <div className="space-y-2">
            {node.aiAnalysis.evidence.map((claim) => (
              <div key={claim.evidenceId || claim.source} className="p-3 rounded-xl border border-slate-900 bg-slate-950/40 text-xs space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-mono text-cyan-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {claim.evidenceId} · {claim.source}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                    claim.weight >= 0.9 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    claim.weight >= 0.7 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    Weight: {(claim.weight * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed font-sans">{claim.derivedFrom}</p>
                {claim.linkedRecordId && (
                  <div className="flex items-center gap-1 text-[9px] text-cyan-500 font-mono mt-1">
                    <Link2 className="w-2.5 h-2.5" />
                    <span>Cites field: {claim.linkedRecordId}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: System-Generated Telemetry Evidence */}
      <div className="space-y-2">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
          System-Generated Records
        </span>
        <div className="grid grid-cols-1 gap-2">
          {/* KYC Status */}
          {node?.kyc && (
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-900 bg-slate-950/20 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileSearch className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-slate-300">KYC Status</span>
              </div>
              <span className="text-slate-500 text-[10px] font-mono">{node.kyc.kycStatus}</span>
            </div>
          )}

          {/* CBS Account details */}
          {node?.cbs && (
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-900 bg-slate-950/20 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Database className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-slate-300">CBS Nominee</span>
              </div>
              <span className="text-slate-500 text-[10px] font-mono">{node.cbs.nominee || 'None'}</span>
            </div>
          )}

          {/* Device logs */}
          {node?.device && (
            <div className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
              node.device.vpnDetected || node.device.simChanged ? 'border-amber-500/20 bg-amber-500/5' : 'border-slate-900 bg-slate-950/20'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <Fingerprint className={`w-3.5 h-3.5 flex-shrink-0 ${node.device.vpnDetected || node.device.simChanged ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="text-slate-300">Device/SIM Match</span>
              </div>
              <span className={`text-[10px] font-mono ${node.device.vpnDetected || node.device.simChanged ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                {node.device.vpnDetected ? 'VPN Flagged' : node.device.simChanged ? 'SIM Swapped' : 'Verified Match'}
              </span>
            </div>
          )}

          {/* Cyber Complaint (1930 Portal) */}
          {node?.complaint && (
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span className="text-slate-300">1930 Portal Linked</span>
              </div>
              <span className="text-red-400 text-[10px] font-mono font-bold">FIR #{node.complaint.complaintId}</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Officer-Uploaded Evidence */}
      <div className="space-y-2 border-t border-slate-900/60 pt-4">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
          Officer-Uploaded Records
        </span>

        {/* Upload zone */}
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleRealUpload(Array.from(e.dataTransfer.files)) }}
          className={`border border-dashed rounded-xl p-4 text-center transition-all duration-200 bg-slate-950/20 border-slate-800 ${
            uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-700/80 hover:bg-slate-900/20'
          }`}
        >
          <div className="space-y-1">
            {uploading
              ? <Upload className="w-4 h-4 mx-auto text-cyan-400 animate-spin" />
              : <Upload className="w-4 h-4 mx-auto text-slate-500" />
            }
            <div className="text-[11px]">
              <span className="font-semibold text-cyan-400">
                {uploading ? 'Uploading…' : 'Click or drag to upload document'}
              </span>
              <p className="text-[9px] text-slate-500 mt-0.5">PDF, CSV, PNG, LOG up to 10MB</p>
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.csv,.png,.log,.txt,.jpg,.jpeg"
          className="hidden"
          onChange={e => { handleRealUpload(Array.from(e.target.files)); e.target.value = '' }}
        />

        {/* Uploaded Files list */}
        <div className="space-y-2 max-h-[160px] overflow-y-auto">
          {files.length === 0 ? (
            <div className="text-center py-4 border border-slate-900 rounded-xl bg-slate-950/10 text-slate-600 text-[10px] font-mono">
              No files uploaded for this node.
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

      {/* SECTION 4: Timeline of Collected Evidence */}
      <div className="space-y-2 border-t border-slate-900/60 pt-4">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
          Collected Evidence Timeline
        </span>
        {evidenceTimeline.length === 0 ? (
          <div className="text-center py-4 text-slate-600 font-mono text-[10px]">
            No evidence events compiled.
          </div>
        ) : (
          <div className="relative pl-3.5 border-l border-slate-800 space-y-3.5 text-[11px] py-1">
            {evidenceTimeline.map((item, idx) => (
              <div key={idx} className="relative">
                {/* timeline dot */}
                <div className={`absolute -left-[18.5px] top-1.5 w-1.5 h-1.5 rounded-full ring-2 ring-slate-900 ${
                  item.type === 'System' ? 'bg-cyan-500' :
                  item.type === 'Alert' ? 'bg-red-500' :
                  'bg-emerald-500'
                }`} />
                <div className="flex justify-between text-xs gap-2">
                  <span className="text-slate-300 font-sans leading-relaxed">{item.label}</span>
                  <span className="text-[9px] text-slate-500 font-mono flex-shrink-0">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
