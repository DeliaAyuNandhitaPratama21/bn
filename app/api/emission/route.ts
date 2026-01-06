export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const userId = session.user.id

  const existing = await prisma.emission.findUnique({
    where: { userId },
  })

  if (!existing) {
    const created = await prisma.emission.create({
      data: {
        userId,
        totalKarbon: body.total_karbon,
        detail: body.detail,
      },
    })
    return NextResponse.json(created)
  }

  const updated = await prisma.emission.update({
    where: { userId },
    data: {
      totalKarbon: existing.totalKarbon + body.total_karbon,
      detail: [...(existing.detail as any[]), ...body.detail],
    },
  })

  return NextResponse.json(updated)
}
