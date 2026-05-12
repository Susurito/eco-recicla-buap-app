import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /api/auth/register
 * Crea usuario con contraseña y perfil de estudiante.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const emailRaw = typeof body.email === "string" ? body.email.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const boletaRaw =
      typeof body.boleta === "string" ? body.boleta.trim().toUpperCase() : ""

    if (!emailRaw || !EMAIL_RE.test(emailRaw)) {
      return NextResponse.json({ error: "Correo electrónico no válido" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    const email = emailRaw.toLowerCase()

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo" },
        { status: 409 }
      )
    }

    const boleta =
      boletaRaw && boletaRaw.length >= 4 ? boletaRaw : `EST${Date.now()}`

    const usedBoleta = await prisma.student.findUnique({ where: { boleta } })
    if (usedBoleta) {
      return NextResponse.json(
        { error: "La boleta ya está registrada. Usa otra o deja el campo vacío." },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          passwordHash,
          role: "student",
        },
      })
      await tx.student.create({
        data: {
          boleta,
          userId: user.id,
          ecoPoints: 0,
          classifications: 0,
          level: "Principiante",
        },
      })
    })

    return NextResponse.json(
      { message: "Cuenta creada correctamente. Ya puedes iniciar sesión." },
      { status: 201 }
    )
  } catch (error) {
    console.error("[auth/register POST]", error)
    return NextResponse.json(
      { error: "No se pudo completar el registro" },
      { status: 500 }
    )
  }
}
