import { AppProvider } from './context/AppContext'
import MainLayout from './components/layout/MainLayout'
import './index.css'

const App = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  )
}

export default App
