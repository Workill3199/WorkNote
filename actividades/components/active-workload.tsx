"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Briefcase } from "lucide-react"

export function ActiveWorkload() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <Briefcase className="h-3.5 w-3.5 text-primary" />
          </div>
          <CardTitle className="text-sm">Carga Activa</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Evaluaciones</span>
            <span className="font-semibold">4/10</span>
          </div>
          <Progress value={40} className="h-1.5" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Clases</span>
            <span className="font-semibold">8/12</span>
          </div>
          <Progress value={66} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  )
}
