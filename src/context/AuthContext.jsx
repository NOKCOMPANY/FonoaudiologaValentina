import { createContext, useContext, useState, useEffect } from 'react'
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

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = async () => {
    const result     = await signInWithPopup(auth, provider)
    const credential = GoogleAuthProvider.credentialFromResult(result)
    setAccessToken(credential.accessToken)
    return result.user
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setAccessToken(null)
    setUser(null)
  }

  const isAdmin = user?.email?.toLowerCase() === config.valentinEmail.toLowerCase()

  return (
    <AuthContext.Provider value={{ user, accessToken, signIn, signOut, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
