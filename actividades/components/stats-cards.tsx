import { Card } from "@/components/ui/card"
import { CheckCircle2, Clock, TrendingUp } from "lucide-react"

export function StatsCards() {
  const stats = [
    {
      label: "Actividades Pendientes",
      value: "2",
      subtitle: "Sin evaluaciones esta semana",
      icon: CheckCircle2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Horas Activas",
      value: "12.5",
      subtitle: "Esta semana",
      icon: Clock,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Progreso",
      value: "85%",
      subtitle: "Completado",
      icon: TrendingUp,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm p-3 transition-all hover:bg-card/70 hover:shadow-md hover:shadow-primary/5"
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className={`rounded-xl ${stat.bgColor} p-2`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} strokeWidth={2} />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
              <p className="text-[10px] font-medium text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
