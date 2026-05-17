import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

const LoginPage = ({ onLogin }) => {
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('AML Compliance Officer')

  const handleLogin = () => {
    onLogin(employeeId, role)
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel w-full max-w-md rounded-2xl p-8 border border-slate-800/70"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-400 tracking-wide">IOB</p>
            <p className="text-xs text-slate-500 font-mono">MUSKETS Access</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-mono">Employee ID</label>
            <input
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              placeholder="IOB-EMP-XXXX"
              className="mt-2 w-full rounded-lg bg-slate-900/70 border border-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-mono">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-lg bg-slate-900/70 border border-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-mono">Role</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="mt-2 w-full rounded-lg bg-slate-900/70 border border-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
            >
              <option>AML Compliance Officer</option>
              <option>Legal & Principal Officer</option>
              <option>Branch Manager</option>
            </select>
          </div>

          <motion.button
            type="button"
            onClick={handleLogin}
            className="w-full mt-2 py-2.5 rounded-lg bg-cyan-500/90 text-slate-950 text-sm font-bold tracking-wide"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            Login to MUSKETS
          </motion.button>
        </div>

        <p className="text-[11px] text-slate-500 mt-4">
          Demo credentials: IOB-EMP-4821 / any password
        </p>
      </motion.div>
    </div>
  )
}

export default LoginPage
