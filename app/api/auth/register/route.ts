import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { randomUUID } from "node:crypto"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /api/auth/register
 * Crea usuario con contraseña y perfil de estudiante (boleta generada automáticamente).
 *
 * Nota: la inserción en "User" usa SQL parametrizado para que funcione aunque el cliente
 * de Prisma no se haya regenerado tras añadir `passwordHash` (detén `pnpm dev` y ejecuta
 * `npx prisma generate` para alinear el cliente con el esquema).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const emailRaw = typeof body.email === "string" ? body.email.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const name = typeof body.name === "string" ? body.name.trim() : ""

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
    const displayName = name || email.split("@")[0]

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo" },
        { status: 409 }
      )
    }

    const boleta = `EST${Date.now()}`
    const passwordHash = await bcrypt.hash(password, 10)
    const userId = randomUUID()

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "createdAt", "updatedAt")
        VALUES (${userId}, ${displayName}, ${email}, ${passwordHash}, 'student', NOW(), NOW())
      `

      await tx.student.create({
        data: {
          boleta,
          userId: userId,
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
  } catch (error: unknown) {
    console.error("[auth/register POST]", error)
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code: string }).code === "string"
        ? (error as { code: string }).code
        : ""
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: "No se pudo completar el registro" },
      { status: 500 }
    )
  }
}
