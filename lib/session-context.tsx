"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react"
import type { SessionData } from "./dal"

interface SessionContextType {
  session: SessionData | null
  loading: boolean
  refetch: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch session from public /api/session endpoint
  // This runs on initial load to check if user is logged in
  // Public visitors will get null, authenticated users will get their session data
  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch("/api/session")
      if (response.ok) {
        const data = await response.json()
        if (data) {
          console.log("[SessionProvider] User session verified")
        } else {
          console.log("[SessionProvider] Public visitor - no session")
        }
        setSession(data)
      } else {
        console.log("[SessionProvider] Session check returned", response.status)
        setSession(null)
      }
    } catch (error) {
      console.error("[SessionProvider] Error checking session:", error)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial session load
  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  // Auto-refresh session every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchSession, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchSession])

  // Listen for logout in other tabs via localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth-logout-signal") {
        console.log("Logout signal detected, clearing session")
        setSession(null)
        setLoading(false)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // Use BroadcastChannel for better cross-tab communication
  useEffect(() => {
    try {
      const channel = new BroadcastChannel("session-updates")

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === "logout") {
          console.log("Logout broadcast received, clearing session")
          setSession(null)
          setLoading(false)
        } else if (event.data.type === "session-update") {
          console.log("Session update broadcast received, refetching")
          fetchSession()
        }
      }

      channel.addEventListener("message", handleMessage)
      return () => {
        channel.removeEventListener("message", handleMessage)
        channel.close()
      }
    } catch (error) {
      // BroadcastChannel not supported in this environment
      console.warn("BroadcastChannel not supported:", error)
    }
  }, [fetchSession])

  return (
    <SessionContext.Provider value={{ session, loading, refetch: fetchSession }}>
      {children}
    </SessionContext.Provider>
  )
}

/**
 * Hook to access session state
 * Returns { session, loading, refetch }
 * session will be null if user is not authenticated
 * loading will be true while verifying session
 */
export function useSession(): SessionContextType {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}
