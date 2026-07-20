import { AppProvider } from './context/AppContextSimplified'
import { InvestigationProvider } from './context/InvestigationContext'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './components/auth/LoginPage'
import { useAuth } from './components/auth/AuthContext'
import { Analytics } from '@vercel/analytics/react'
import './index.css'

const App = () => {
  const { currentUser, login } = useAuth()

  if (!currentUser) {
    return (
      <>
        <LoginPage onLogin={(employeeId, role) => login(employeeId, role)} />
        <Analytics />
      </>
    )
  }

  return (
    <AppProvider>
      <InvestigationProvider>
        <MainLayout />
        <Analytics />
      </InvestigationProvider>
    </AppProvider>
  )
}

export default App