import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { APP_STATES } from '../../context/AppContext'

const maskAccountNumber = (accountNumber) => {
  if (!accountNumber || accountNumber.length < 8) {
    return 'XXXX-XXXX'
  }
  const prefix = accountNumber.slice(0, 4)
  const suffix = accountNumber.slice(-4)
  return `${prefix}****${suffix}`
}

const SoftHoldNotification = ({ appState, containedNode, caseMetadata }) => {
  const [isVisible, setIsVisible] = useState(false)
  const previousStateRef = useRef(appState)

  useEffect(() => {
    const wasContained = previousStateRef.current === APP_STATES.CONTAINED
    if (!wasContained && appState === APP_STATES.CONTAINED) {
      setIsVisible(true)
      previousStateRef.current = appState
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 5000)

      return () => clearTimeout(timer)
    }

    previousStateRef.current = appState
    return undefined
  }, [appState])

  const maskedAccount = maskAccountNumber(containedNode?.account_number)
  const caseId = caseMetadata?.case_id || 'FRA-XXXX-IOB'

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: 120 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 120 }}
            transition={{ duration: 0.3 }}
            className="glass-panel-dark w-[320px] rounded-xl border border-slate-800/70 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  width="80"
                  height="140"
                  viewBox="0 0 80 140"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="4" y="4" width="72" height="132" rx="12" stroke="#334155" strokeWidth="2" />
                  <rect x="10" y="18" width="60" height="108" rx="8" fill="#0f172a" />
                  <circle cx="40" cy="128" r="4" fill="#1e293b" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-cyan-400 mb-2">IOB Alert</p>
                <p className="text-[11px] text-slate-300 leading-4">
                  A transaction from your account {maskedAccount} has been temporarily held for review by
                  IOB Fraud Prevention. If you did not initiate this, contact your branch immediately.
                  Ref: {caseId}
                </p>
                <p className="text-[10px] text-slate-500 mt-2">SMS Notification Sent</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SoftHoldNotification
