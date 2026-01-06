import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan password wajib diisi" },
        { status: 400 }
      )
    }

    const exists = await prisma.user.findUnique({
      where: { email },
    })

    if (exists) {
      return NextResponse.json(
        { message: "Email sudah terdaftar" },
        { status: 409 }
      )
    }

    const hashed = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        email,
        password: hashed,
      },
    })

    return NextResponse.json(
      { message: "Registrasi berhasil" },
      { status: 201 }
    )
  } catch (e) {
    console.error("REGISTER ERROR:", e)
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    )
  }
}
