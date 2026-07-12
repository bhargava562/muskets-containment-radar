import { motion } from 'framer-motion'
import { Eye, EyeOff, ShieldAlert, GitBranch } from 'lucide-react'

export default function ExpandPreviewPanel({ showPreview, setShowPreview }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3.5 shadow-xl max-w-sm"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-red-500/10 text-red-400 mt-0.5 border border-red-500/20">
          <GitBranch className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-1">
          <span className="text-[9px] font-mono text-red-400 uppercase tracking-wider block font-bold">
            Scope Expansion Preview Available
          </span>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Secondary counterparty hop detected. Previewing will display downstream nodes (+2 hops).
          </p>
          <div className="pt-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all duration-200 ${
                showPreview
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/15'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-200 hover:bg-slate-750'
              }`}
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  Hide Scope Preview
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  Preview Hops (+2)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
