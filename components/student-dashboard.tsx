"use client"

import { type Student } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Leaf,
  Trophy,
  Star,
  Wifi,
  GraduationCap,
  Coffee,
  Utensils,
  QrCode,
  Recycle,
  TrendingUp,
} from "lucide-react"
import { useState, useEffect } from "react"

interface Prize {
  id: string
  name: string
  description: string
  cost: number
  icon: string
  category: "internet" | "academic" | "cafeteria"
}

interface StudentDashboardProps {
  student: Student
}

function getPrizeIcon(iconName: string) {
  switch (iconName) {
    case "wifi":
      return <Wifi className="h-5 w-5" />
    case "graduation-cap":
      return <GraduationCap className="h-5 w-5" />
    case "coffee":
      return <Coffee className="h-5 w-5" />
    case "utensils":
      return <Utensils className="h-5 w-5" />
    default:
      return <Star className="h-5 w-5" />
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "internet":
      return "bg-blue-500/10 text-blue-700 border-blue-200"
    case "academic":
      return "bg-amber-500/10 text-amber-700 border-amber-200"
    case "cafeteria":
      return "bg-primary/10 text-primary border-primary/20"
    default:
      return ""
  }
}

export default function StudentDashboard({ student }: StudentDashboardProps) {
  const [qrDialog, setQrDialog] = useState(false)
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // TODO: Obtener nextLevel desde configuración o API
  const nextLevel = 2000
  const progress = (student.ecoPoints / nextLevel) * 100

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
    if (student.ecoPoints >= prize.cost) {
      setSelectedPrize(prize)
      setQrDialog(true)
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        {/* Student Header */}
        <div className="rounded-xl bg-primary p-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
              <Leaf className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{student.name}</h2>
              <p className="text-sm text-primary-foreground/80">
                Boleta: {student.boleta}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/30">
              {student.level}
            </Badge>
            <span className="text-sm text-primary-foreground/80">
              {student.classifications} clasificaciones
            </span>
          </div>
        </div>

        {/* Eco-Points Card */}
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-4 w-4 text-primary" />
                Eco-Points
              </CardTitle>
              <span className="text-2xl font-bold text-primary">
                {student.ecoPoints.toLocaleString()}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Nivel actual</span>
                <span>
                  {student.ecoPoints} / {nextLevel} pts
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

         {/* Quick Stats */}
         <div className="grid grid-cols-3 gap-3">
           <Card>
             <CardContent className="flex flex-col items-center justify-center gap-2 p-4 h-full">
               <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                 <Recycle className="h-5 w-5 text-primary" />
               </div>
               <div className="text-center">
                 <p className="text-2xl font-bold text-foreground leading-none">
                   {student.classifications}
                 </p>
                 <p className="text-xs text-muted-foreground">
                   Clasificaciones
                 </p>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="flex flex-col items-center justify-center gap-2 p-4 h-full">
               <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                 <TrendingUp className="h-5 w-5 text-amber-600" />
               </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground leading-none">
                    {/* TODO: Obtener ranking de API */}
                    —
                  </p>
                  <p className="text-xs text-muted-foreground">Ranking</p>
                </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="flex flex-col items-center justify-center gap-2 p-4 h-full">
               <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                 <Leaf className="h-5 w-5 text-green-600" />
               </div>
               <div className="text-center">
                 <p className="text-2xl font-bold text-foreground leading-none">
                   75%
                 </p>
                 <p className="text-xs text-muted-foreground">Progreso</p>
               </div>
             </CardContent>
           </Card>
         </div>

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
                 const canAfford = student.ecoPoints >= prize.cost
                 return (
                   <Card
                     key={prize.id}
                     className={`transition-all ${canAfford ? "hover:border-primary/40 cursor-pointer" : "opacity-60"}`}
                   >
                     <CardContent className="flex items-center gap-3 p-3">
                       <div
                         className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${getCategoryColor(prize.category)}`}
                       >
                         {getPrizeIcon(prize.icon)}
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
                  {getPrizeIcon(selectedPrize.icon)}
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
    </ScrollArea>
  )
}
