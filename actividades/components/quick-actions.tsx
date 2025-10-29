import { FileText, Calendar, Users, TrendingUp } from "lucide-react"

export function QuickActions() {
  const actions = [
    { icon: FileText, label: "New Assignment", color: "text-blue-400" },
    { icon: Calendar, label: "Schedule Class", color: "text-purple-400" },
    { icon: Users, label: "View Students", color: "text-cyan-400" },
    { icon: TrendingUp, label: "Analytics", color: "text-emerald-400" },
  ]

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            className="flex flex-col items-center gap-2 rounded-xl bg-card p-4 transition-all hover:bg-card/80 hover:scale-[1.02] active:scale-[0.98]"
          >
            <action.icon className={`h-5 w-5 ${action.color}`} />
            <span className="text-xs font-medium text-foreground">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
