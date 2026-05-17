# Muskets Simplified Architecture - Implementation Guide

## Overview
This is a **lightweight prototype** demonstrating "Workflow Continuity Illusion" using React Context only. No backend, no APIs, no real auth.

## The Illusion
Three workspaces share one global state array (`cases`). When Analyst approves → status changes → Compliance sees it → Branch sees customer restriction.

---

## STEP 1: Global State Engine ✅ CREATED

**File**: `src/context/AppContextSimplified.jsx`

### State Schema
```javascript
{
  id: 'FRA-2026-IOB-00847',
  priority: 'P1' | 'P2' | 'P3',
  riskAmount: 200000,
  recoverableAmount: 135000,
  status: 'PENDING_TRIAGE' | 'AWAITING_LEGAL_REVIEW' | 'RESOLVED',
  summary: '₹2L dispersed to 5 accounts in 42s',
  timestamp: ISO string,
  victimAccount: string,
  muleAccounts: string[],
  merchantAccounts: string[],
  graphStructureId: string
}
```

### Core Functions
- `updateCaseStatus(caseId, newStatus)` - Updates case status
- `approveContainment(caseId)` - Analyst approves → status = AWAITING_LEGAL_REVIEW
- `resolveCase(caseId)` - Compliance resolves → status = RESOLVED
- `getCasesByStatus(status)` - Filter cases by status

### Initial Data
3 hardcoded cases:
- P1: ₹2L, 5 accounts, 42s
- P2: ₹85K, 3 mules
- P3: ₹45K, low velocity

---

## STEP 2: Analyst Workspace (70% focus)

### Components to Refactor

#### 2.1 InvestigationQueue.jsx
**Current**: Priority-based triage with expandable AI summary
**Changes Needed**:
```javascript
// Read from context
const { getCasesByStatus, setSelectedCase } = useApp()
const pendingCases = getCasesByStatus(CASE_STATUS.PENDING_TRIAGE)

// Render minimalist cards
{pendingCases.map(case => (
  <CaseCard 
    priority={case.priority}
    amount={case.riskAmount}
    summary={case.summary}
    onClick={() => setSelectedCase(case)}
  />
))}
```

**Remove**:
- Transaction streaming logic
- Threat alert detection
- Graph initialization
- All websocket/polling code

**Keep**:
- Priority grouping (P1/P2/P3)
- Countdown timer
- Expandable AI summary
- Clean card UI

#### 2.2 RadarCanvas.jsx
**Current**: Force-directed graph with animation
**Changes Needed**:
```javascript
// Simplified graph - just visual representation
const { selectedCase } = useApp()

// Load graph structure from mock data based on selectedCase.graphStructureId
// Strip out ALL analytical overlays
// Just show: Victim → Mule → Merchant flow
```

**Remove**:
- Sequential node revelation
- Forensic playback
- Heavy animations
- Analyzing states

**Keep**:
- Basic force-directed layout
- Node colors (victim=blue, mule=red, merchant=green)
- Simple hover tooltips

#### 2.3 ContainmentActionPanel.jsx
**Current**: Clean UI with Option A vs B comparison
**Changes Needed**:
```javascript
const { selectedCase, approveContainment } = useApp()

// Show Option A (Full Freeze) vs Option B (Partial Lien)
// When user clicks [ Approve Partial Hold ]:
<motion.button
  onClick={() => {
    approveContainment(selectedCase.id)
    // Framer Motion: animate case disappearing from queue
  }}
>
  Approve Partial Hold
</motion.button>
```

**Remove**:
- deployNetworkContainment (too complex)
- freezeNode logic
- Graph state mutations

**Keep**:
- Option A vs B comparison
- Customer Impact Score
- Historical Context
- Auto-drafted justification
- Massive approve button

---

## STEP 3: Compliance Workspace (20% focus)

### Components to Refactor

#### 3.1 ComplianceWorkspace.jsx
**Current**: Case governance panel with timeline
**Changes Needed**:
```javascript
const { getCasesByStatus, resolveCase } = useApp()
const pendingReview = getCasesByStatus(CASE_STATUS.AWAITING_LEGAL_REVIEW)

// Pending Reviews Table
<table>
  {pendingReview.map(case => (
    <tr>
      <td>{case.id}</td>
      <td>{formatCurrency(case.riskAmount)}</td>
      <td>Partial Lien (Recommended)</td>
      <td>{formatTime(case.timestamp)}</td>
      <td>
        <button onClick={() => resolveCase(case.id)}>
          Approve
        </button>
      </td>
    </tr>
  ))}
</table>
```

**Design**:
- Clean, formal, boring enterprise SaaS
- Light/neutral theme (not dark cyberpunk)
- Highly legible typography
- No graphs

**Views**:
1. **Pending Reviews**: Data table with cases awaiting legal sign-off
2. **Audit Timeline**: Simple vertical list (Alert → Trace → Lien → Approval)
3. **Export Center**: Dummy buttons that show toast notifications

---

## STEP 4: Branch Workspace (10% focus)

### Components to Refactor

#### 4.1 BranchWorkspace.jsx
**Current**: Customer lookup with search
**Changes Needed**:
```javascript
const { cases } = useApp()
const [searchQuery, setSearchQuery] = useState('')

// Search by account number
const handleSearch = () => {
  const matchedCase = cases.find(c => 
    c.victimAccount === searchQuery ||
    c.muleAccounts.includes(searchQuery) ||
    c.merchantAccounts.includes(searchQuery)
  )
  
  if (matchedCase && matchedCase.status !== CASE_STATUS.PENDING_TRIAGE) {
    // Show restriction status
    setCustomerStatus({
      restricted: true,
      restrictedAmount: matchedCase.recoverableAmount,
      availableBalance: 2100000 - matchedCase.recoverableAmount,
      reason: 'Temporary restriction applied due to suspicious transaction velocity.'
    })
  }
}
```

**Design**:
- Calm, simplified, reassuring UI
- Soft colors (not dark mode)
- Large, readable text

**Features**:
1. **Customer Lookup**: Search bar
2. **Restriction Status Card**: 
   - If case approved by Analyst: Show "Restricted Amount: ₹X | Available: ₹Y"
   - Human explanation (no technical jargon)
3. **Actions**:
   - [ Request Central Review ] button
   - Drag-and-drop zone for KYC docs (dummy)
   - Branch managers CANNOT release funds

---

## Implementation Order

### Phase 1: Replace AppContext
1. Backup current `AppContext.jsx` → `AppContext.OLD.jsx`
2. Rename `AppContextSimplified.jsx` → `AppContext.jsx`
3. Update imports in `App.jsx`

### Phase 2: Refactor Analyst Workspace
1. Update `InvestigationQueue.jsx` to read from `getCasesByStatus`
2. Simplify `RadarCanvas.jsx` - remove animations
3. Update `ContainmentActionPanel.jsx` to use `approveContainment`
4. Test workflow: Click approve → case disappears from queue

### Phase 3: Refactor Compliance Workspace
1. Update `ComplianceWorkspace.jsx` to show pending reviews table
2. Add dummy export buttons
3. Test workflow: Approve → case status = RESOLVED

### Phase 4: Refactor Branch Workspace
1. Update `BranchWorkspace.jsx` to search cases
2. Show restriction status based on case status
3. Test workflow: Search account → see restriction

---

## Key Principles

### DO NOT OVERENGINEER
- No backend APIs
- No real authentication
- No database
- No websockets
- No complex state machines

### FOCUS ON THE ILLUSION
- Analyst clicks → Compliance sees
- Compliance approves → Branch sees
- All powered by one shared array

### CLEAN UI
- Remove raw math equations
- Remove cyberpunk clutter
- Use clean flexbox layouts
- Smooth Framer Motion transitions

---

## Testing the Illusion

1. **Login as Analyst**
   - See 3 cases in queue
   - Click case → see graph
   - Click "Approve Partial Hold"
   - Case disappears with animation

2. **Login as Compliance**
   - See case in "Pending Reviews" table
   - Click "Approve"
   - Case moves to "Resolved"

3. **Login as Branch**
   - Search for account number
   - See "Restricted Amount: ₹135K"
   - See human explanation
   - Cannot release funds

---

## Files to Modify

### Core
- [x] `src/context/AppContextSimplified.jsx` - Created
- [ ] `src/context/AppContext.jsx` - Replace with simplified version
- [ ] `src/App.jsx` - Update imports

### Analyst
- [ ] `src/components/watchtower/InvestigationQueue.jsx` - Read from context
- [ ] `src/components/radar/RadarCanvas.jsx` - Simplify graph
- [ ] `src/components/interrogation/ContainmentActionPanel.jsx` - Use approveContainment

### Compliance
- [ ] `src/components/workspaces/ComplianceWorkspace.jsx` - Add table view

### Branch
- [ ] `src/components/workspaces/BranchWorkspace.jsx` - Add case search

---

## Success Criteria

✅ Analyst approves → Case status changes
✅ Compliance sees case in pending reviews
✅ Branch sees customer restriction
✅ No backend required
✅ Clean, minimal UI
✅ Smooth animations
✅ Works as hackathon demo

---

## Next Steps

1. Review this implementation guide
2. Confirm approach with team
3. Start with Phase 1 (Replace AppContext)
4. Test each phase before moving to next
5. Keep it simple - resist urge to add complexity
