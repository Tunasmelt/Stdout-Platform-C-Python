import { NextResponse } from 'next/server'

// Pure reachability probe for lib/offline/network.ts — deliberately does not
// touch Supabase or any database; it only needs to answer "is the server
// reachable at all," not "is the backend healthy."
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
