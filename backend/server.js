import express from 'express'
import { EventEmitter } from 'events'

const app = express()
app.use(express.json())

// Robust CORS middleware supporting preflight OPTIONS requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

const bus = new EventEmitter()

// In-memory state — resets on server restart (fine for demo)
let state = {
  appState: 'MONITORING',
  transactions: [],
  alertQueue: []
}

// POST /txn — phones submit transactions here
app.post('/txn', (req, res) => {
  const { amount, from, to, type } = req.body
  const txn = {
    id: `TXN-${Date.now()}`,
    amount: Number(amount),
    from, to, type,
    timestamp: new Date().toISOString()
  }
  
  state.transactions.unshift(txn)

  // Triage classification
  const recentFromSame = state.transactions
    .filter(t => t.from === from && Date.now() - new Date(t.timestamp) < 120000)
  
  const velocity = recentFromSame.length / 2  // per minute over 2 min window
  const dwell = 0  // simplified: instant relay assumed for demo
  const fragRatio = recentFromSame.filter(t => t.amount < amount * 0.4).length + 1
  
  // MuleHunter alert simulation trigger
  if (velocity > 5 || (type === 'IMPS' && amount > 30000 && fragRatio > 2)) {
    state.appState = 'THREAT_DETECTED'
    const alert = {
      id: `ALERT-${Date.now()}`,
      caseId: `FRA-2026-IOB-${Math.floor(Math.random() * 90000) + 10000}`,
      riskScore: Math.min(99, Math.round(velocity * 8 + fragRatio * 12)),
      totalAmount: amount,
      triggeredBy: txn.id,
      velocity: velocity.toFixed(1),
      fragRatio: fragRatio.toFixed(1),
      timestamp: new Date().toISOString()
    }
    state.alertQueue.unshift(alert)
    bus.emit('state_change', state)
  } else {
    bus.emit('state_change', state)
  }
  
  res.json({ received: true, classified: state.appState })
})

// GET /state — frontend polls this
app.get('/state', (req, res) => res.json(state))

// GET /events — SSE stream for real-time updates
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)
  send(state)  // send current state immediately on connect

  bus.on('state_change', send)
  req.on('close', () => bus.off('state_change', send))
})

// POST /reset — demo reset button
app.post('/reset', (req, res) => {
  state = { appState: 'MONITORING', transactions: [], alertQueue: [] }
  bus.emit('state_change', state)
  res.json({ reset: true })
})

const port = process.env.PORT || 3001
app.listen(port, () => console.log(`Muskets mock backend running on port ${port}`))
