import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export type VerifiedCredentialsUser = {
  id: string
  email: string
  name: string | null
  image: string | null
  role: string
}

/**
 * Carga usuario y hash desde la BD (evita cliente Prisma desactualizado sin `passwordHash`).
 */
export async function verifyCredentialsUser(
  email: string,
  password: string
): Promise<VerifiedCredentialsUser | null> {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !password) return null

  const rows = await prisma.$queryRaw<
    Record<string, unknown>[]
  >`
    SELECT id, email, name, image, role, "passwordHash"
    FROM "User"
    WHERE email = ${normalized}
    LIMIT 1
  `

  const row = rows[0]
  const hashRaw =
    (row?.passwordHash ?? row?.passwordhash) as string | null | undefined
  const hash = typeof hashRaw === "string" ? hashRaw.trim() : ""
  if (!row || !hash) return null

  const id = String(row.id)
  const emailOut = String(row.email)
  const name = (row.name as string | null) ?? null
  const image = (row.image as string | null) ?? null
  const role = String(row.role ?? "student")

  const ok = await bcrypt.compare(password, hash)
  if (!ok) return null

  return {
    id,
    email: emailOut,
    name,
    image,
    role,
  }
}
