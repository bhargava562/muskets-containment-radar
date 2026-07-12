import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Send, User } from 'lucide-react'
import { useInvestigation } from '../../context/InvestigationContext'

export default function CaseNotesPanel() {
  const { context, addCaseNote } = useInvestigation()
  const [newNote, setNewNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const notes = context?.caseNotes || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newNote.trim() || submitting) return
    setSubmitting(true)
    try {
      await addCaseNote(newNote.trim())
      setNewNote('')
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (isoString) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return ''
    }
  }

  return (
    <div className="flex flex-col space-y-3 h-[320px]">
      <h3 className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-2">
        <FileText className="w-3.5 h-3.5 text-slate-500" /> Case Notes
      </h3>

      {/* Notes scroll container */}
      <div className="flex-1 overflow-y-auto bg-slate-950/40 border border-slate-900 rounded-xl p-3 space-y-3 max-h-[220px]">
        {notes.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-[10px] font-mono">
            No notes logged
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.noteId} className="text-xs space-y-1 bg-slate-900/40 p-2.5 rounded-lg border border-slate-900/60">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span className="font-semibold flex items-center gap-1 text-slate-400">
                  <User className="w-2.5 h-2.5" /> {note.author}
                </span>
                <span>{formatTime(note.timestamp)}</span>
              </div>
              <p className="text-slate-300 font-sans leading-relaxed">{note.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Add note input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add internal case note..."
          disabled={submitting}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-700 transition-colors"
        />
        <button
          type="submit"
          disabled={!newNote.trim() || submitting}
          className={`p-1.5 rounded-lg text-slate-900 transition-colors flex items-center justify-center ${
            newNote.trim() && !submitting ? 'bg-cyan-400 hover:bg-cyan-500' : 'bg-slate-800 text-slate-600'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  )
}
