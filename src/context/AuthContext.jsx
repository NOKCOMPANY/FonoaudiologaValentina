import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { config } from '../lib/config'

const AuthContext = createContext(null)

const provider = new GoogleAuthProvider()
provider.addScope('https://www.googleapis.com/auth/calendar.readonly')

const TOKEN_KEY = 'goog_access_token'
const TOKEN_EXP = 'goog_token_exp'
const TOKEN_TTL = 55 * 60 * 1000

function saveToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(TOKEN_EXP, Date.now() + TOKEN_TTL)
}

function loadToken() {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const exp   = parseInt(sessionStorage.getItem(TOKEN_EXP) ?? '0')
  if (token && Date.now() < exp) return token
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_EXP)
  return null
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_EXP)
}

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null)
  const [accessToken, setAccessToken] = useState(() => loadToken())
  const [loading, setLoading]         = useState(true)
  const [needsTokenRefresh, setNeedsTokenRefresh] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
      if (u) {
        const cached = loadToken()
        if (cached) {
          setAccessToken(cached)
          setNeedsTokenRefresh(false)
        } else {
          setNeedsTokenRefresh(true)
        }
      } else {
        setAccessToken(null)
        setNeedsTokenRefresh(false)
      }
    })
    return unsub
  }, [])

  const signIn = useCallback(async () => {
    const result     = await signInWithPopup(auth, provider)
    const credential = GoogleAuthProvider.credentialFromResult(result)
    const token      = credential.accessToken
    saveToken(token)
    setAccessToken(token)
    setNeedsTokenRefresh(false)
    setUser(result.user)
    return result.user
  }, [])

  const refreshCalendarToken = useCallback(async () => {
    try {
      const result     = await signInWithPopup(auth, provider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      const token      = credential.accessToken
      saveToken(token)
      setAccessToken(token)
      setNeedsTokenRefresh(false)
    } catch (e) {
      if (e.code !== 'auth/cancelled-popup-request' && e.code !== 'auth/popup-closed-by-user') {
        console.error('Token refresh error:', e)
      }
    }
  }, [])

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
    clearToken()
    setAccessToken(null)
    setUser(null)
    setNeedsTokenRefresh(false)
  }, [])

  const isAdmin = user?.email?.toLowerCase() === config.valentinEmail.toLowerCase()

  return (
    <AuthContext.Provider value={{
      user, accessToken, signIn, signOut, loading,
      isAdmin, needsTokenRefresh, refreshCalendarToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
