import { useState } from 'react'
import { Cpu, Send, Sparkles } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'

export default function ReviewCommentBar() {
  const { selectedNodeId, reanalyzeAI, loading, context } = useInvestigation()
  const [comment, setComment] = useState('')

  if (!context || !selectedNodeId) return null

  const handleReanalyze = async (e) => {
    e.preventDefault()
    if (!comment.trim() || !selectedNodeId || loading) return
    try {
      await reanalyzeAI(selectedNodeId, comment.trim())
      setComment('')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
      <form onSubmit={handleReanalyze} className="flex-1 flex gap-3 items-center">
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0">
          <Cpu className="w-4 h-4" />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">
            CHALLENGE AI COPILOT ON NODE: {selectedNodeId}
          </span>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={loading}
            placeholder={`Provide feedback to challenge AI's rating on node ${selectedNodeId} (e.g., 'KYC verified via video call, mark as likely innocent')`}
            className="w-full bg-transparent border-0 p-0 pt-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-0 min-w-0"
          />
        </div>
        <button
          type="submit"
          disabled={!comment.trim() || loading}
          className={`flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-slate-900 transition-all ${
            comment.trim() && !loading
              ? 'bg-cyan-400 hover:bg-cyan-500 shadow-md'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{loading ? 'Reevaluating...' : 'Ask Copilot'}</span>
        </button>
      </form>
    </div>
  )
}
