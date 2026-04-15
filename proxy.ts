import { auth } from "@/auth"
import { NextResponse } from "next/server"

// List of protected routes that require authentication
const protectedRoutes = ["/dashboard", "/profile", "/student-metrics"]

export default auth(function middleware(request) {
  const { nextUrl } = request
  const pathname = nextUrl.pathname

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