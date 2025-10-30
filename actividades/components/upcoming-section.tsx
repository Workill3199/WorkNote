import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, GraduationCap } from "lucide-react"

export function UpcomingSection() {
  const upcoming = [
    {
      title: "Revisión Proyecto Final",
      time: "Hoy - 3:00 PM",
      type: "Evaluación",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Clase de Introducción",
      time: "Mañana - 10:00 AM",
      type: "Clase",
      icon: GraduationCap,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Reunión de Padres",
      time: "Viernes - 2:00 PM",
      type: "Reunión",
      icon: Calendar,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ]

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base">Próximamente</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcoming.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
          >
            <div className={`rounded-lg ${item.bgColor} p-2`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-tight">{item.title}</p>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {item.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{item.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
