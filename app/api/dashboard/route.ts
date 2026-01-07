export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth_DISABLE/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const emission = await prisma.emission.findUnique({
    where: { userId },
  })

  if (!emission) {
    return NextResponse.json({
      totalEmisi: 0,
      monthlyEmissionData: [],
      categoryEmissionData: [],
    })
  }

  const month = new Date().toLocaleString("id-ID", { month: "short" })
  const monthlyEmissionData = [{ month, emisi: emission.totalKarbon }]

  const category: Record<string, number> = {}
  const items = Array.isArray(emission.detail) ? emission.detail : []

  items.forEach((i: any) => {
    category[i.produk] = (category[i.produk] || 0) + (i.karbon || 0)
  })

  const categoryEmissionData = Object.entries(category).map(
    ([name, value]) => ({ name, value })
  )

  return NextResponse.json({
    totalEmisi: emission.totalKarbon,
    monthlyEmissionData,
    categoryEmissionData,
  })
}
