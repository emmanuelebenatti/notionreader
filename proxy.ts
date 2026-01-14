import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

/**
 * Next.js Proxy (Middleware) for authentication.
 * Protects all routes except /login and /api/auth/*.
 * Validates session tokens against the PostgreSQL database.
 * 
 * In demo mode (no DATABASE_URL), authentication is skipped entirely.
 * 
 * Note: In Next.js 16+, this file should be named proxy.ts (not middleware.ts)
 */
export async function proxy(request: NextRequest) {
  // Demo mode: skip authentication when no database is configured
  if (!process.env.DATABASE_URL) {
    // Redirect login page to home in demo mode
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  const authToken = request.cookies.get("auth-token")?.value
  const isLoginPage = request.nextUrl.pathname === "/login"
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth")

  // Allow auth API routes
  if (isApiAuth) {
    return NextResponse.next()
  }

  // If no token, redirect to login (unless already on login page)
  if (!authToken && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Verify token is valid in database
  if (authToken && !isLoginPage) {
    try {
      const sql = neon(process.env.DATABASE_URL!)
      const result = await sql`
        SELECT id FROM sessions 
        WHERE token = ${authToken} 
        AND expires_at > NOW()
        LIMIT 1
      `

      // If session not found or expired, redirect to login
      if (result.length === 0) {
        const response = NextResponse.redirect(new URL("/login", request.url))
        response.cookies.delete("auth-token")
        return response
      }
    } catch (error) {
      console.error("Proxy auth error:", error)
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // Redirect to home if already authenticated and trying to access login
  if (isLoginPage && authToken) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}

