import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, FileText, MessageSquare, CheckCircle } from "lucide-react"

export function RecentActivity() {
  const activities = [
    {
      icon: CheckCircle,
      title: "Evaluación completada",
      description: "Proyecto Final - María García",
      time: "Hace 2h",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: MessageSquare,
      title: "Nuevo comentario",
      description: "Juan Pérez en Tarea 3",
      time: "Hace 4h",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: FileText,
      title: "Entrega pendiente",
      description: "Ana López - Ensayo",
      time: "Hace 1d",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ]

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-chart-3/10 p-2">
            <Activity className="h-4 w-4 text-chart-3" />
          </div>
          <CardTitle className="text-base">Actividad Reciente</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
          >
            <div className={`rounded-lg ${activity.bgColor} p-2 mt-0.5`}>
              <activity.icon className={`h-4 w-4 ${activity.color}`} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{activity.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
            </div>
            <span className="text-xs text-muted-foreground/70 whitespace-nowrap">{activity.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
