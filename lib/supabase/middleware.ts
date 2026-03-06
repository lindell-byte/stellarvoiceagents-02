import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validate and refresh session; required for Supabase auth
  await supabase.auth.getClaims()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isProtectedPath =
    pathname === '/dashboard' ||
    pathname === '/upload' ||
    pathname.startsWith('/upload/') ||
    pathname === '/dashboard/leads' ||
    pathname.startsWith('/dashboard/leads/') ||
    pathname === '/leads' ||
    pathname.startsWith('/leads/')
  const isAuthPage =
    pathname === '/login' || pathname === '/signup'

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/leads'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
