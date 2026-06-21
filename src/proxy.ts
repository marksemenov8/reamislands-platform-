import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/start",
  "/matched",
  "/programs",
  "/about",
  "/auth/callback",
  "/api/intake",
  "/api/auth",
  "/api/bookings/public",
]

const PANEL_HOSTS = new Set(["panel.dreamislands.org"])
const PUBLIC_HOSTS = new Set(["dreamislands.org", "www.dreamislands.org"])

const PUBLIC_HOST_ALLOWED = [
  "/",
  "/start",
  "/matched",
  "/programs",
  "/about",
  "/api/intake",
  "/api/programs",
  "/api/properties",
  "/api/bookings/public",
]

const PANEL_HOST_ALLOWED = [
  "/",
  "/login",
  "/auth",
  "/me",
  "/partner",
  "/admin",
  "/api/auth",
  "/api/me",
  "/api/admin",
  "/api/users",
  "/api/specialists",
  "/api/bookings",
  "/api/programs",
  "/api/properties",
  "/api/services",
  "/api/accommodations",
  "/api/upload",
  "/api/intake",
]

function pathMatches(pathname: string, allowed: string[]) {
  return allowed.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

function normalizeHost(hostHeader: string | null): string {
  if (!hostHeader) return ""
  return hostHeader.toLowerCase().split(":")[0]
}

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

export async function proxy(request: NextRequest) {
  const host = normalizeHost(request.headers.get("host"))
  const { pathname } = request.nextUrl

  if (PUBLIC_HOSTS.has(host) && !pathMatches(pathname, PUBLIC_HOST_ALLOWED)) {
    return new NextResponse("Not found", { status: 404 })
  }
  if (PANEL_HOSTS.has(host) && !pathMatches(pathname, PANEL_HOST_ALLOWED)) {
    return new NextResponse("Not found", { status: 404 })
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (isPublic(pathname)) {
    if (user && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return response
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
