import { useMemo, useState } from 'react'
import { Search, Clock, Shield, Filter, ArrowRight, FileText } from 'lucide-react'
import { useApp } from '../../context/AppContextSimplified'

export default function GlobalAuditLogs() {
  const { cases } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedActor, setSelectedActor] = useState('ALL')

  // Aggregate and sort all logs across all cases
  const allLogs = useMemo(() => {
    const logs = []
    cases.forEach(c => {
      if (c.auditLog) {
        c.auditLog.forEach(entry => {
          logs.push({
            ...entry,
            caseId: c.id,
            customerName: c.customerName
          })
        })
      }
    })
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [cases])

  // Filter logs by search query and selected actor
  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      const matchSearch = 
        log.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchActor = selectedActor === 'ALL' || log.actor === selectedActor
      
      return matchSearch && matchActor
    })
  }, [allLogs, searchQuery, selectedActor])

  // Extract unique actors for the filter dropdown
  const actors = useMemo(() => {
    const unique = new Set(['ALL'])
    allLogs.forEach(log => unique.add(log.actor))
    return Array.from(unique)
  }, [allLogs])

  return (
    <div className="h-full flex flex-col p-6 space-y-6 bg-slate-950 overflow-hidden">
      {/* Header */}
      <div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
          COMPLIANCE OPERATIONS AUDIT
        </span>
        <h2 className="text-xl font-bold text-slate-200 tracking-wide">
          Global Case Activities & SIEM Logs
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Chronological record of every system alert trigger, AI reanalysis, officer action, and legal escalation dossier across the institution.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex gap-4 items-center bg-slate-900/40 p-4 border border-slate-900 rounded-2xl">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Case ID, action, or log details..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
          />
        </div>

        {/* Actor Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedActor}
            onChange={(e) => setSelectedActor(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
          >
            {actors.map(actor => (
              <option key={actor} value={actor}>
                {actor === 'ALL' ? 'All Actors' : actor}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table Area */}
      <div className="flex-1 min-h-0 border border-slate-900 rounded-2xl bg-slate-950/20 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 text-xs font-mono py-12">
              No audit logs matched search filters.
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-900/10 text-slate-500 font-mono tracking-wider">
                  <th className="p-4 font-semibold text-[10px]">TIMESTAMP</th>
                  <th className="p-4 font-semibold text-[10px]">CASE ID</th>
                  <th className="p-4 font-semibold text-[10px]">ACTOR</th>
                  <th className="p-4 font-semibold text-[10px]">ACTION</th>
                  <th className="p-4 font-semibold text-[10px]">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredLogs.map((log, idx) => {
                  const actorColor =
                    log.actor === 'System' ? 'text-violet-400 bg-violet-500/10 border border-violet-500/20' :
                    log.actor === 'AI Copilot' ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20' :
                    log.actor === 'AML Officer' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' :
                    log.actor === 'Legal Officer' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                    'text-slate-400 bg-slate-800'

                  return (
                    <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                      <td className="p-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-300">
                        {log.caseId}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${actorColor}`}>
                          {log.actor}
                        </span>
                      </td>
                      <td className="p-4 text-slate-200 font-medium">
                        {log.action}
                      </td>
                      <td className="p-4 text-slate-400 leading-relaxed font-mono text-[11px]">
                        {log.details || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
