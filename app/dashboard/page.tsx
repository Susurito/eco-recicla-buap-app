import { verifyStudentSession, verifyAdminSession } from "@/lib/dal"
import DashboardClient from "@/components/dashboard-client"

export default async function DashboardPage() {
  // Verify user is authenticated and is either a student or admin
  // This will redirect to /login if not authenticated
  let session
  let isAdmin = false
  
  try {
    session = await verifyAdminSession()
    isAdmin = true
  } catch {
    // User is not admin, try student
    session = await verifyStudentSession()
  }

  // Render the dashboard with user information
  return (
    <DashboardClient 
      isAdmin={isAdmin} 
      userId={session.user.id}
      userName={session.user.name || "Usuario"}
      userImage={session.user.image}
    />
  )
}
