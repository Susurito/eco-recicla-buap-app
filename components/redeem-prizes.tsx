"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Trophy, QrCode, Star } from "lucide-react"
import { useState, useEffect } from "react"
import * as LucideIcons from "lucide-react"

interface PrizeCategory {
  id: string
  name: string
  description?: string
  color: string
}

interface Prize {
  id: string
  name: string
  description: string
  cost: number
  icon: string
  category: PrizeCategory
}

interface RedeemPrizesProps {
  studentEcoPoints: number
  onRedeem?: (prize: Prize) => void
}

/**
 * Dynamically render Lucide icon by name
 */
function renderLucideIcon(iconName: string, className: string = "h-5 w-5") {
  try {
    // Convert kebab-case to PascalCase (e.g., "graduation-cap" -> "GraduationCap")
    const iconKey = iconName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("") as keyof typeof LucideIcons

    const IconComponent = LucideIcons[iconKey] as React.ComponentType<{ className?: string }>

    if (!IconComponent) {
      return <Star className={className} />
    }

    return <IconComponent className={className} />
  } catch {
    return <Star className={className} />
  }
}

export default function RedeemPrizes({
  studentEcoPoints,
  onRedeem,
}: RedeemPrizesProps) {
  const [qrDialog, setQrDialog] = useState(false)
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch prizes from API
  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/prizes?limit=100")
        if (!response.ok) {
          throw new Error("Failed to fetch prizes")
        }
        const data = await response.json()
        setPrizes(data.data || [])
      } catch (err) {
        console.error("Error fetching prizes:", err)
        setError("Error al cargar los premios")
        setPrizes([])
      } finally {
        setLoading(false)
      }
    }

    fetchPrizes()
  }, [])

  const handleRedeem = (prize: Prize) => {
    if (studentEcoPoints >= prize.cost) {
      setSelectedPrize(prize)
      setQrDialog(true)
      onRedeem?.(prize)
    }
  }

  return (
    <>
      {/* Prizes Section */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Canjear Premios
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando premios...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : prizes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay premios disponibles</p>
          ) : (
            prizes.map((prize) => {
              const canAfford = studentEcoPoints >= prize.cost
              return (
                <Card
                  key={prize.id}
                  className={`transition-all ${
                    canAfford ? "hover:border-primary/40 cursor-pointer" : "opacity-60"
                  }`}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
                      style={{
                        backgroundColor: `${prize.category.color}15`,
                        borderColor: prize.category.color,
                        color: prize.category.color,
                      }}
                    >
                      {renderLucideIcon(prize.icon, "h-5 w-5")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {prize.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {prize.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={canAfford ? "default" : "outline"}
                      disabled={!canAfford}
                      onClick={() => handleRedeem(prize)}
                      className={
                        canAfford
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                          : "shrink-0"
                      }
                    >
                      {prize.cost} pts
                    </Button>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrDialog} onOpenChange={setQrDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Premio Canjeado</DialogTitle>
            <DialogDescription className="text-center">
              Muestra este codigo QR para reclamar tu premio
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {selectedPrize && (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  {renderLucideIcon(selectedPrize.icon, "h-6 w-6")}
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {selectedPrize.name}
                </p>
                {/* Simulated QR Code */}
                <div className="flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-muted/50">
                  <div className="flex flex-col items-center gap-2">
                    <QrCode className="h-20 w-20 text-foreground" />
                    <span className="text-xs text-muted-foreground">
                      QR-{selectedPrize.id}-{Date.now().toString(36)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Valido por 24 horas desde el momento del canje
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
