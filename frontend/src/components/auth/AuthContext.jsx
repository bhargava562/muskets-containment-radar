import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)

  const login = useCallback((employeeId, role) => {
    setCurrentUser({
      employeeId,
      role,
      loginTime: new Date().toISOString()
    })
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
  }, [])

  const value = useMemo(() => ({ currentUser, login, logout }), [currentUser, login, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
