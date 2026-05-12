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
  onRedemptionSuccess?: () => void
}

interface RedemptionData {
  redemptionId: string
  prizeId: string
  prizeName: string
  qrCode: string
  qrImageUrl: string
  redemptionCode: string
  expiresAt: string
  ecoPointsRemaining: number
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
  onRedemptionSuccess,
}: RedeemPrizesProps) {
  const [qrDialog, setQrDialog] = useState(false)
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [redemptionData, setRedemptionData] = useState<RedemptionData | null>(null)
  const [currentEcoPoints, setCurrentEcoPoints] = useState(studentEcoPoints)

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

  // Update current eco points when prop changes
  useEffect(() => {
    setCurrentEcoPoints(studentEcoPoints)
  }, [studentEcoPoints])

  const handleRedeemClick = (prize: Prize) => {
    if (currentEcoPoints >= prize.cost) {
      setSelectedPrize(prize)
      // Show confirmation dialog before redeeming
      setQrDialog(true)
    }
  }

  const handleConfirmRedemption = async () => {
    if (!selectedPrize) return

    setIsRedeeming(true)
    try {
      const response = await fetch("/api/students/me/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prizeId: selectedPrize.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error || "Failed to redeem prize"
        )
      }

      const data = await response.json()
      setRedemptionData(data.data)
      setCurrentEcoPoints(data.data.ecoPointsRemaining)
      onRedeem?.(selectedPrize)
      onRedemptionSuccess?.()

      console.log("Prize redeemed successfully:", data)
    } catch (err) {
      console.error("Error redeeming prize:", err)
      alert(
        `Error al canjear: ${err instanceof Error ? err.message : "Unknown error"}`
      )
      setQrDialog(false)
    } finally {
      setIsRedeeming(false)
    }
  }

  const handleCloseDialog = () => {
    setQrDialog(false)
    setSelectedPrize(null)
    setRedemptionData(null)
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
                       onClick={() => handleRedeemClick(prize)}
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
      <Dialog open={qrDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              {redemptionData ? "Premio Canjeado" : "Confirmar Canje"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {redemptionData
                ? "Muestra este código QR para reclamar tu premio"
                : "¿Deseas canjear este premio?"}
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

                {!redemptionData ? (
                  // Confirmation view
                  <>
                    <p className="text-sm text-muted-foreground text-center">
                      Costo: <span className="font-semibold">{selectedPrize.cost} eco points</span>
                    </p>
                    <p className="text-sm text-muted-foreground text-center">
                      Tendrás:{" "}
                      <span className="font-semibold text-primary">
                        {currentEcoPoints - selectedPrize.cost}
                      </span>{" "}
                      eco points restantes
                    </p>
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        onClick={handleCloseDialog}
                        className="flex-1"
                        disabled={isRedeeming}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleConfirmRedemption}
                        disabled={isRedeeming}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {isRedeeming ? "Canjeando..." : "Confirmar Canje"}
                      </Button>
                    </div>
                  </>
                ) : (
                  // QR view
                  <>
                    {/* QR Code Image */}
                    <div className="flex h-48 w-48 items-center justify-center rounded-xl border-2 bg-white p-2">
                      {redemptionData.qrImageUrl ? (
                        <img
                          src={redemptionData.qrImageUrl}
                          alt="QR Code"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <QrCode className="h-20 w-20 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Cargando QR...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Redemption Code */}
                    <div className="w-full">
                      <p className="text-xs font-medium text-muted-foreground text-center mb-1">
                        Código de canje
                      </p>
                      <p className="font-mono text-sm font-bold text-center bg-muted p-2 rounded">
                        {redemptionData.redemptionCode}
                      </p>
                    </div>

                    {/* Expiration Info */}
                    <p className="text-xs text-muted-foreground text-center">
                      ⏱️ Válido por 24 horas desde el momento del canje
                    </p>

                    {/* Screenshot reminder */}
                    <div className="w-full bg-blue-100 border border-blue-300 rounded p-2">
                      <p className="text-xs text-blue-900 text-center">
                        📸 Toma una captura de pantalla de este código para poder presentarlo
                      </p>
                    </div>

                    <Button
                      onClick={handleCloseDialog}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Cerrar
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
