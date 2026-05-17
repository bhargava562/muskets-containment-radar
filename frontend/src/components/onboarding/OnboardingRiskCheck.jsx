import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ShieldAlert } from 'lucide-react'

const buildSignals = ({ accountAgeDays, hasDeviceId }) => {
  const signals = []

  if (accountAgeDays < 30) {
    signals.push({
      id: 'signal-age',
      tone: 'border-red-500/40 text-red-300 bg-red-950/30',
      text: `HIGH RISK: Account opened ${accountAgeDays} days ago. New accounts receiving high-value transfers immediately after opening is a known mule account recruitment pattern.`
    })
  } else {
    signals.push({
      id: 'signal-age',
      tone: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30',
      text: `Account age is ${accountAgeDays} days. No new-account risk signal detected.`
    })
  }

  if (!hasDeviceId) {
    signals.push({
      id: 'signal-device',
      tone: 'border-amber-500/40 text-amber-300 bg-amber-950/30',
      text: 'CAUTION: No device fingerprint on file. Cannot verify account holder\'s usual device.'
    })
  } else {
    signals.push({
      id: 'signal-device',
      tone: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30',
      text: 'Device fingerprint captured. Identity verification signal available.'
    })
  }

  signals.push({
    id: 'signal-monitoring',
    tone: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/30',
    text: 'Monitoring Status: This account will be flagged for enhanced monitoring for the next 90 days per RBI Circular 2025.'
  })

  return signals
}

const OnboardingRiskCheck = () => {
  const [accountNumber, setAccountNumber] = useState('')
  const [openingDate, setOpeningDate] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [location, setLocation] = useState('')
  const [signals, setSignals] = useState([])
  const [showToast, setShowToast] = useState(false)

  const accountAgeDays = useMemo(() => {
    if (!openingDate) return 0
    const opened = new Date(openingDate)
    const now = new Date()
    const diff = Math.max(0, now - opened)
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }, [openingDate])

  const handleRiskCheck = () => {
    const nextSignals = buildSignals({
      accountAgeDays,
      hasDeviceId: Boolean(deviceId.trim())
    })
    setSignals(nextSignals)
  }

  const handleWatchlist = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full w-full glass-panel rounded-2xl p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Onboarding Risk Check</h3>
          <p className="text-[11px] text-slate-500 font-mono">Pre-account activation screening</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-amber-300">
          <ShieldAlert className="w-4 h-4" />
          AML Compliance
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-[10px] text-slate-400 font-mono">Account Number</label>
          <input
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value)}
            className="mt-2 w-full rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            placeholder="1855010000XXXX"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-mono">Account Opening Date</label>
          <input
            type="date"
            value={openingDate}
            onChange={(event) => setOpeningDate(event.target.value)}
            className="mt-2 w-full rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-mono">Device ID (Optional)</label>
          <input
            value={deviceId}
            onChange={(event) => setDeviceId(event.target.value)}
            className="mt-2 w-full rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            placeholder="DEV-A7F2B"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-mono">Location</label>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="mt-2 w-full rounded-lg bg-slate-900/70 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            placeholder="Chennai, TN"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          onClick={handleRiskCheck}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold"
        >
          Run Risk Check
        </motion.button>
        <motion.button
          type="button"
          onClick={handleWatchlist}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 rounded-lg bg-slate-800/80 text-slate-200 text-xs font-semibold"
        >
          Add to Watchlist
        </motion.button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className={`rounded-lg border px-3 py-2 text-[11px] leading-4 ${signal.tone}`}
          >
            {signal.text}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-[11px] text-emerald-300"
          >
            <CheckCircle2 className="w-4 h-4" />
            Account added to enhanced monitoring queue
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default OnboardingRiskCheck
