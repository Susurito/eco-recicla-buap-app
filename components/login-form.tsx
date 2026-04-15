"use client"

import { cn } from "@/lib/utils"
import { LoginFormContent } from "@/components/login-form-content"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <LoginFormContent />
    </div>
  )
}
