"use client"

import { cn } from "@/lib/utils"

function initialFromName(name?: string | null, email?: string | null): string {
  const s = (name?.trim() || email?.trim() || "?").replace(/^@/, "")
  const ch = s[0]
  return ch ? ch.toUpperCase() : "?"
}

interface UserAvatarProps {
  name?: string | null
  email?: string | null
  image?: string | null
  className?: string
  /** Estilos extra solo para el círculo con inicial (sin foto) */
  fallbackClassName?: string
  size?: number
}

export function UserAvatar({
  name,
  email,
  image,
  className,
  fallbackClassName,
  size = 40,
}: UserAvatarProps) {
  const letter = initialFromName(name, email)
  const dim = `${size}px`
  const fontSize = Math.max(12, Math.round(size * 0.42))

  if (image) {
    return (
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        className={cn("rounded-full object-cover shrink-0", className)}
        style={{ width: dim, height: dim }}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground",
        fallbackClassName,
        className
      )}
      style={{ width: dim, height: dim, fontSize }}
      aria-hidden
    >
      {letter}
    </div>
  )
}
