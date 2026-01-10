export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type EmissionDetail = {
  produk: string
  emisi: number
  kategori: string
}

// 🔹 NORMALISASI NAMA PRODUK
function normalizeProductName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, total_karbon, detail } = body

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
      produk: normalizeProductName(String(d.produk)),
      emisi: Number(d.emisi) || 0,
      kategori: String(d.kategori || "lainnya"),
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

    const created = await prisma.emission.create({
      data: {
        userId: user.id,
        totalKarbon: total_karbon,
        detail: safeDetail,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("EMISSION API ERROR:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
