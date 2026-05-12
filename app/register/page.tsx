import { Recycle } from "lucide-react"
import Link from "next/link"
import { RegisterFormContent } from "@/components/register-form-content"

export const dynamic = "force-dynamic"

export default function RegisterPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[url('/images/fondo.png')] bg-cover bg-center p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-xl bg-white/10 p-6 shadow backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Recycle className="size-4" />
          </div>
          Eco-Recicla BUAP
        </Link>
        <RegisterFormContent />
      </div>
    </div>
  )
}
