"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User } from "./types"
import { userStorage, currentUserStorage, initializeDefaultData } from "./storage"

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => boolean
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Inicializar datos por defecto
    initializeDefaultData()

    // Verificar si hay un usuario en sesión
    const currentUser = currentUserStorage.get()
    if (currentUser) {
      setUser(currentUser)
    }
    setIsLoading(false)
  }, [])

  const login = (username: string, password: string): boolean => {
    const foundUser = userStorage.findByUsername(username)

    if (foundUser && foundUser.password === password && foundUser.active) {
      setUser(foundUser)
      currentUserStorage.set(foundUser)
      return true
    }

    return false
  }

  const logout = () => {
    setUser(null)
    currentUserStorage.remove()
    router.push("/login")
  }

  if (isLoading) {
    return null
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
