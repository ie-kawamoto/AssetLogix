import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import Dashboard from './Dashboard'
import Assets from './Assets'
import '../styles/App.scss'

function App() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(parsedUser)
      } catch (error) {
        console.error('Failed to restore session:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }

    fetch('http://localhost:3000/api/test')
      .then(res => res.json())
      .then(data => {
        console.log(data)
      })
      .catch(error => {
        console.error('API health check failed:', error)
      })
  }, [])

  const handleLogin = (newToken: string, newUser: any) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  if (!token || !user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard user={user} onLogout={handleLogout} />} />
      <Route path="/assets" element={<Assets user={user} onLogout={handleLogout} />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
