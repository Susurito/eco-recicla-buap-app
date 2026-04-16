import { verifySession } from "@/lib/dal"
import DashboardClient from "@/components/dashboard-client"

export default async function DashboardPage() {
  // Verify user is authenticated
  // This will redirect to /login if not authenticated
  const session = await verifySession()

  // Check if user is admin
  const isAdmin = session.role === "admin"

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
