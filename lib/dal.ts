import { auth } from "@/auth"
import { redirect } from "next/navigation"

export type SessionRole = "student" | "admin"

export interface SessionData {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: SessionRole
  }
  isAuthenticated: boolean
  role: SessionRole
}

/**
 * Verify that user has an active session
 * Returns session data with user info and role
 * Redirects to /login if no session exists
 */
export async function verifySession(): Promise<SessionData> {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  return {
    user: {
      id: session.user.id || "",
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      role: (session.user.role as SessionRole) || "student",
    },
    isAuthenticated: true,
    role: (session.user.role as SessionRole) || "student",
  }
}

/**
 * Verify that user has an active session AND is a student
 * Redirects to /login if no session or if not a student
 */
export async function verifyStudentSession(): Promise<SessionData> {
  const sessionData = await verifySession()

  if (sessionData.role !== "student") {
    redirect("/dashboard") // Or appropriate admin page
  }

  return sessionData
}

/**
 * Verify that user has an active session AND is an admin
 * Redirects to /login if no session or if not an admin
 */
export async function verifyAdminSession(): Promise<SessionData> {
  const sessionData = await verifySession()

  if (sessionData.role !== "admin") {
    redirect("/dashboard") // Or appropriate student page
  }

  return sessionData
}

/**
 * Get session without redirecting (returns null if no session)
 * Useful for checking permissions in middleware or conditional rendering
 */
export async function getSession(): Promise<SessionData | null> {
  const session = await auth()

  if (!session || !session.user) {
    return null
  }

  return {
    user: {
      id: session.user.id || "",
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      role: (session.user.role as SessionRole) || "student",
    },
    isAuthenticated: true,
    role: (session.user.role as SessionRole) || "student",
  }
}
