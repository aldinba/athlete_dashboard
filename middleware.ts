import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session and trying to access protected routes
  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/auth"
    return NextResponse.redirect(redirectUrl)
  }

  // If session and trying to access auth page
  if (session && req.nextUrl.pathname.startsWith("/auth")) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/dashboard"
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/api/:path*"],
}

