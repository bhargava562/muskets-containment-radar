import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, File, Trash, ArrowRight, ShieldCheck } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'

export default function EvidenceRepository({ nodeId }) {
  const { context, refreshContext } = useInvestigation()
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'
  const files = context?.evidenceRepository || []

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
      { name: `Device_IP_Mismatch_Audit_${nodeId}.log`, size: 12288 }
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
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Case Evidence Repository</h4>

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
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">UPLOADED ARTIFACTS</span>
        {files.length === 0 ? (
          <div className="text-center py-6 border border-slate-900 rounded-xl bg-slate-950/10 text-slate-600 text-[10px] font-mono">
            No evidence uploaded for this node
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
  )
}
