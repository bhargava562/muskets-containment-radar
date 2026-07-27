import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, GitBranch, X } from 'lucide-react'

export default function ExpandPreviewPanel({ showPreview, setShowPreview }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="absolute top-4 left-4 z-30">
      {/* Alert Icon Button on Left Sidebar Control Rail */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Scope Expansion Alert Available"
        className={`relative p-2.5 rounded-xl border backdrop-blur transition-all duration-200 flex items-center justify-center ${
          isOpen || showPreview
            ? 'bg-red-500/20 border-red-500/40 text-red-400 shadow-lg shadow-red-950/30'
            : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
        }`}
      >
        <GitBranch className="w-4 h-4" />
        
        {/* Pulsing Alert Notification Badge */}
        {!showPreview && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-slate-900"></span>
          </span>
        )}
      </button>

      {/* Emerging Sidebar Popup Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-0 left-12 ml-2 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl z-40"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  <GitBranch className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-bold">
                  Scope Expansion Alert
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed mb-3">
              Secondary counterparty hop detected on unlisted transactions. Previewing will display downstream nodes (+2 hops).
            </p>

            <button
              onClick={() => {
                setShowPreview(!showPreview)
              }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
