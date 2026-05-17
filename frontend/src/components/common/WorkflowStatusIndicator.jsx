import { motion } from 'framer-motion'
import { Radio, Target, TrendingUp, Shield, FileCheck } from 'lucide-react'
import { APP_STATES } from '../../context/AppContext'

const WorkflowStatusIndicator = ({ appState, caseId }) => {
  const getStateConfig = () => {
    switch (appState) {
      case APP_STATES.MONITORING:
        return {
          icon: Radio,
          label: 'MONITORING',
          color: 'emerald',
          description: 'Scanning for anomalies',
          step: 1
        }
      case APP_STATES.THREAT_DETECTED:
        return {
          icon: Target,
          label: 'THREAT DETECTED',
          color: 'red',
          description: 'Alert triggered',
          step: 2
        }
      case APP_STATES.TRACING:
        return {
          icon: TrendingUp,
          label: 'TRACING',
          color: 'amber',
          description: 'Building fund lineage',
          step: 3
        }
      case APP_STATES.INVESTIGATING:
        return {
          icon: Shield,
          label: 'INVESTIGATING',
          color: 'amber',
          description: 'Analyst review in progress',
          step: 4
        }
      case APP_STATES.CONTAINED:
        return {
          icon: Shield,
          label: 'CONTAINED',
          color: 'cyan',
          description: 'Containment active',
          step: 5
        }
      case APP_STATES.AUDIT_LOGGED:
        return {
          icon: FileCheck,
          label: 'AUDIT LOGGED',
          color: 'emerald',
          description: 'Awaiting legal review',
          step: 6
        }
      default:
        return {
          icon: Radio,
          label: 'OFFLINE',
          color: 'slate',
          description: 'System offline',
          step: 0
        }
    }
  }

  const config = getStateConfig()
  const StateIcon = config.icon

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/40',
      text: 'text-emerald-400',
      dot: 'bg-emerald-500'
    },
    red: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/40',
      text: 'text-red-400',
      dot: 'bg-red-500'
    },
    amber: {
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/40',
      text: 'text-amber-400',
      dot: 'bg-amber-500'
    },
    cyan: {
      bg: 'bg-cyan-500/20',
      border: 'border-cyan-500/40',
      text: 'text-cyan-400',
      dot: 'bg-cyan-500'
    },
    slate: {
      bg: 'bg-slate-500/20',
      border: 'border-slate-500/40',
      text: 'text-slate-400',
      dot: 'bg-slate-500'
    }
  }

  const colors = colorClasses[config.color]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-panel-dark rounded-lg px-3 py-2 border ${colors.border} ${colors.bg}`}
    >
      <div className="flex items-center gap-2">
        <motion.div
          className={`w-2 h-2 rounded-full ${colors.dot}`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <StateIcon className={`w-3.5 h-3.5 ${colors.text}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${colors.text} font-mono`}>
              {config.label}
            </span>
            {caseId && appState !== APP_STATES.MONITORING && (
              <span className="text-[9px] text-slate-500 font-mono">
                {caseId}
              </span>
            )}
          </div>
          <p className="text-[9px] text-slate-500">{config.description}</p>
        </div>
        {config.step > 0 && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div
                key={step}
                className={`w-1 h-1 rounded-full ${
                  step <= config.step ? colors.dot : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default WorkflowStatusIndicator
