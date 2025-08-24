import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  console.log("[v0] Middleware: Processing request for:", request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  await supabase.auth.refreshSession()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Middleware: User from getUser():", user ? user.email : "No user")
  console.log(
    "[v0] Middleware: Cookies:",
    request.cookies.getAll().map((c) => `${c.name}=${c.value.substring(0, 20)}...`),
  )

  if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin/auth")) {
    if (!user) {
      console.log("[v0] Middleware: No user found, redirecting to login")
      const url = request.nextUrl.clone()
      url.pathname = "/admin/auth/login"
      return NextResponse.redirect(url)
    }

    // Check if user exists in usuarios_sistema table and is active
    const { data: usuario, error } = await supabase
      .from("usuarios_sistema")
      .select("*")
      .eq("email", user.email)
      .eq("activo", true)
      .single()

    console.log("[v0] Middleware: Usuario query result:", { usuario: usuario?.email, error })

    if (error || !usuario) {
      console.log("[v0] Middleware: User not found in usuarios_sistema or inactive:", error)
      const url = request.nextUrl.clone()
      url.pathname = "/admin/auth/login"
      return NextResponse.redirect(url)
    }

    console.log("[v0] Middleware: User authenticated and authorized:", usuario.email)
  }

  return supabaseResponse
}
