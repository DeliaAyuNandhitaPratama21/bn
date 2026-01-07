export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type EmissionDetail = {
  produk: string
  emisi: number
}

export async function POST(req: Request) {
  try {
    const { email, total_karbon, detail } = await req.json()

    // ==== VALIDASI ====
    if (
      !email ||
      typeof total_karbon !== "number" ||
      !Array.isArray(detail)
    ) {
      return NextResponse.json(
        { error: "Data tidak valid" },
        { status: 400 }
      )
    }

    const safeDetail: EmissionDetail[] = detail.map((d: any) => ({
      produk: String(d.produk),
      emisi: Number(d.emisi) || 0,
    }))

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    const existing = await prisma.emission.findUnique({
      where: { userId: user.id },
    })

    // ==== INSERT ====
    if (!existing) {
      const created = await prisma.emission.create({
        data: {
          userId: user.id,
          totalKarbon: total_karbon,
          detail: safeDetail,
        },
      })

      return NextResponse.json(created)
    }

    // ==== UPDATE ====
    const updated = await prisma.emission.update({
      where: { userId: user.id },
      data: {
        totalKarbon: existing.totalKarbon + total_karbon,
        detail: [
          ...(existing.detail as EmissionDetail[]),
          ...safeDetail,
        ],
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error("EMISSION API ERROR:", err)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
