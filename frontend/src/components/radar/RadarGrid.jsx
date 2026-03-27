import React from 'react'
import { motion } from 'framer-motion'
import { Radar } from 'lucide-react'

const RadarGrid = () => {
  const circles = [1, 2, 3, 4]

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Grid Background */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#334155"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Concentric Circles */}
      <div className="relative w-[80%] h-[80%] max-w-[500px] max-h-[500px]">
        {circles.map((circle, index) => (
          <motion.div
            key={circle}
            className="absolute inset-0 rounded-full border border-dashed border-slate-700/50"
            style={{
              transform: `scale(${circle / circles.length})`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: circle / circles.length,
            }}
            transition={{
              opacity: {
                duration: 3,
                repeat: Infinity,
                delay: index * 0.5,
              },
              scale: {
                duration: 0.5,
                delay: index * 0.1,
              },
            }}
          />
        ))}

        {/* Radar Sweep Line - Fixed to rotate from center */}
        <div className="absolute top-1/2 left-1/2 w-full h-full">
          <motion.div
            className="absolute w-1/2 h-0.5"
            style={{
              background: 'linear-gradient(90deg, rgba(34, 211, 238, 0.5) 0%, transparent 100%)',
              transformOrigin: 'left center',
              left: '0',
              top: '0',
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        {/* Center Dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-3 h-3 rounded-full bg-cyan-500/50"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        </div>
      </div>

      {/* Status Text */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-slate-500">
          <Radar className="w-4 h-4" />
          <span className="text-xs font-mono tracking-wider">AWAITING THREAT VECTOR</span>
        </div>
        <motion.div
          className="flex gap-1"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-600"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default RadarGrid
