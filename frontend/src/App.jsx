import { AppProvider } from './context/AppContext'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './components/auth/LoginPage'
import { useAuth } from './components/auth/AuthContext'
import './index.css'

const App = () => {
  const { currentUser, login } = useAuth()

  if (!currentUser) {
    return <LoginPage onLogin={(employeeId, role) => login(employeeId, role)} />
  }

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  )
}

export default App