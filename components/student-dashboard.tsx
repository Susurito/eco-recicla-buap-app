"use client"

import { type Student } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import RedeemPrizes from "@/components/redeem-prizes"
import {
  Leaf,
  Recycle,
  TrendingUp,
  Star,
} from "lucide-react"
import { useState } from "react"

interface StudentDashboardProps {
  student: Student
}

export default function StudentDashboard({ student }: StudentDashboardProps) {

  // TODO: Obtener nextLevel desde configuración o API
  const nextLevel = 2000
  const progress = (student.ecoPoints / nextLevel) * 100

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

          {/* Redeem Prizes Section */}
          <RedeemPrizes studentEcoPoints={student.ecoPoints} />
        </div>
      </ScrollArea>
    )
  }
