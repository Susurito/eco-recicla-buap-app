import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// List of protected routes that require authentication
const protectedRoutes = ["/dashboard", "/profile", "/student-metrics"]

export default auth((request: NextRequest) => {
  const { pathname } = request.nextUrl

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // If route is not protected, allow access
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Check if user has session (auth provides this via request.auth)
  if (!request.auth) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, request.url)
    )
  }

  // Allow access to protected route
  return NextResponse.next()
})

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Protect specific routes
    "/dashboard/:path*",
    "/profile/:path*",
    "/student-metrics/:path*",
    // Exclude Next.js internals and static files
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
