"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export function RegisterFormContent() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [boleta, setBoleta] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          boleta: boleta.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "No se pudo registrar")
        setIsLoading(false)
        return
      }
      router.push("/login?registered=1")
    } catch {
      setError("Error de red. Intenta de nuevo.")
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Crear cuenta</CardTitle>
          <CardDescription>
            Regístrate para guardar tus Eco-Points y clasificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="reg-name">Nombre (opcional)</FieldLabel>
                <Input
                  id="reg-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="reg-email">Correo electrónico</FieldLabel>
                <Input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="tu@correo.com"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="reg-pass">Contraseña</FieldLabel>
                <Input
                  id="reg-pass"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="reg-boleta">Boleta (opcional)</FieldLabel>
                <Input
                  id="reg-boleta"
                  value={boleta}
                  onChange={(e) => setBoleta(e.target.value)}
                  placeholder="Si la omites, se asignará una automática"
                />
                <FieldDescription className="text-xs">
                  Debe ser única en el sistema si la proporcionas.
                </FieldDescription>
              </Field>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Registrarme"}
              </Button>
              <FieldDescription className="text-center">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                  Inicia sesión
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <div className="px-6">
        <Link href="/">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Home
          </Button>
        </Link>
      </div>
    </>
  )
}
