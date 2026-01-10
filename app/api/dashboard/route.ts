export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// =====================
// NORMALISASI KATEGORI (STRICT DARI DATASET)
// =====================
function normalizeKategoriUI(kategori: string) {
  if (kategori === "bahan_pokok") return "Bahan Pokok"
  if (kategori === "daging_produk_hewani") return "Daging & Produk Hewani"
  if (kategori === "sayuran_buah") return "Sayuran & Buah"
  return null // ⬅️ PENTING: lainnya dibuang
}

// =====================
// GET DASHBOARD DATA
// =====================
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const emissions = await prisma.emission.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  })

  if (emissions.length === 0) {
    return NextResponse.json({
      totalEmisi: 0,
      monthlyEmissionData: [],
      categoryEmissionData: [],
    })
  }

  // =====================
  // TOTAL EMISI
  // =====================
  const totalEmisi = emissions.reduce(
    (sum, e) => sum + e.totalKarbon,
    0
  )

  // =====================
  // EMISI BULANAN
  // =====================
  const monthlyMap: Record<string, number> = {}

  emissions.forEach((e) => {
    const month = new Date(e.createdAt).toLocaleString("id-ID", {
      month: "short",
    })

    monthlyMap[month] =
      (monthlyMap[month] || 0) + e.totalKarbon
  })

  const monthlyEmissionData = Object.entries(monthlyMap).map(
  ([month, emisi]) => ({
    month,
    emisi: Number(emisi.toFixed(2)),
  })
)


  // =====================
  // EMISI PER KATEGORI (HANYA 3)
  // =====================
  const categoryMap: Record<string, number> = {
    "Bahan Pokok": 0,
    "Daging & Produk Hewani": 0,
    "Sayuran & Buah": 0,
  }

  emissions.forEach((e) => {
    const details = Array.isArray(e.detail) ? e.detail : []

    details.forEach((d: any) => {
      const kategoriUI = normalizeKategoriUI(d.kategori)
      if (!kategoriUI) return // ⬅️ lainnya dibuang

      const emisi = Number(d.emisi) || 0
      categoryMap[kategoriUI] += emisi
    })
  })

  const categoryEmissionData = Object.entries(categoryMap)
    .filter(([, value]) => value > 0) // ⬅️ aman, nol tidak dikirim
    .map(([name, value]) => ({ name, value }))

  return NextResponse.json({
    totalEmisi,
    monthlyEmissionData,
    categoryEmissionData,
  })
}
