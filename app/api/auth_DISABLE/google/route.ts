import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const { createClient } = await import("@supabase/supabase-js")

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
    },
  })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  return NextResponse.redirect(data.url)
}
