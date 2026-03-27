export const normalTransactions = [
  {
    id: 'TXN001',
    amount: 500,
    merchant: 'QuickMart Groceries',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    status: 'normal',
    accountId: 'ACC_8834'
  },
  {
    id: 'TXN002',
    amount: 1200,
    merchant: 'TechZone Electronics',
    timestamp: new Date(Date.now() - 85000).toISOString(),
    status: 'normal',
    accountId: 'ACC_7721'
  },
  {
    id: 'TXN003',
    amount: 350,
    merchant: 'MedPlus Pharmacy',
    timestamp: new Date(Date.now() - 45000).toISOString(),
    status: 'normal',
    accountId: 'ACC_9102'
  }
]

export const criticalAlert = {
  id: 'ALERT_001',
  amount: 200000,
  type: 'rapid_split',
  description: 'Rapid fund fragmentation detected - ₹2,00,000 split across 3 accounts within 90 seconds',
  timestamp: new Date().toISOString(),
  status: 'critical',
  sourceAccount: 'VICTIM_01',
  targetAccounts: ['MULE_01', 'MULE_02', 'MULE_03'],
  riskScore: 94
}

export const graphData = {
  nodes: [
    {
      id: 'VICTIM_01',
      type: 'victim',
      label: 'VICTIM',
      name: 'Ramesh Kumar',
      balance: 500000,
      accountNumber: 'XXXX-4521',
      bank: 'State Bank'
    },
    {
      id: 'MULE_01',
      type: 'mule',
      label: 'MULE_01',
      name: 'Unknown Entity',
      velocity: 14,
      fragmentationRatio: 4.2,
      accountNumber: 'XXXX-7832',
      bank: 'Private Bank A',
      receivedAmount: 80000
    },
    {
      id: 'MULE_02',
      type: 'mule',
      label: 'MULE_02',
      name: 'Unknown Entity',
      velocity: 8,
      fragmentationRatio: 3.1,
      accountNumber: 'XXXX-2901',
      bank: 'Private Bank B',
      receivedAmount: 60000
    },
    {
      id: 'MULE_03',
      type: 'mule',
      label: 'MULE_03',
      name: 'Unknown Entity',
      velocity: 11,
      fragmentationRatio: 2.8,
      accountNumber: 'XXXX-5567',
      bank: 'Cooperative Bank',
      receivedAmount: 60000
    },
    {
      id: 'MERCHANT_01',
      type: 'merchant',
      label: 'MERCHANT',
      name: 'Sharma Electronics',
      balance: 3000000,
      tracedFunds: 50000,
      accountNumber: 'XXXX-1234',
      bank: 'Commerce Bank',
      classification: 'PASSIVE_INNOCENT'
    }
  ],
  links: [
    { source: 'VICTIM_01', target: 'MULE_01', value: 80000 },
    { source: 'VICTIM_01', target: 'MULE_02', value: 60000 },
    { source: 'VICTIM_01', target: 'MULE_03', value: 60000 },
    { source: 'MULE_03', target: 'MERCHANT_01', value: 50000 }
  ]
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

export const generateAuditHash = () => {
  const chars = '0123456789abcdef'
  let hash = ''
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)]
  }
  return hash
}
