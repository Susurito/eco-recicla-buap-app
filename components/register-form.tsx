"use client"

import { cn } from "@/lib/utils"
import { RegisterFormContent } from "@/components/register-form-content"

export function RegisterForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <RegisterFormContent />
        </div>
    )
}
