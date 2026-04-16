"use client"

import { cn } from "@/lib/utils"
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
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

export function LoginFormContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Use redirect: true to let NextAuth handle the redirect
      await signIn("google", {
        redirect: true,
        callbackUrl: callbackUrl,
      })
    } catch (err) {
      console.error("Sign in error:", err)
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Bienvenido de vuelta</CardTitle>
          <CardDescription>
            Inicia sesión con tu cuenta de Google
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <FieldGroup>
              <Field>
                {error && (
                  <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm mb-4">
                    {error}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      Iniciar sesión con Google
                    </>
                  )}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                O continúa con email
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">Correo Electrónico</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <Input id="password" type="password" required />
              </Field>
              <Field>
                <Button type="submit">Iniciar sesión</Button>
                <FieldDescription className="text-center">
                  ¿No tienes cuenta? <a href="/register">Regístrate</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Al continuar, aceptas nuestros <a href="#">Términos de Servicio</a>{" "}
        y <a href="#">Política de Privacidad</a>.
      </FieldDescription>
    </>
  )
}
