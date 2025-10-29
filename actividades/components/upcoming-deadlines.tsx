import { Clock, AlertCircle } from "lucide-react"

export function UpcomingDeadlines() {
  const deadlines = [
    { title: "Project Submission", date: "Tomorrow", urgent: true },
    { title: "Midterm Grading", date: "In 3 days", urgent: false },
    { title: "Parent Meeting", date: "Friday", urgent: false },
  ]

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Upcoming Deadlines</h2>
      <div className="space-y-2">
        {deadlines.map((deadline) => (
          <div
            key={deadline.title}
            className="flex items-center gap-3 rounded-xl bg-card p-3 transition-all hover:bg-card/80"
          >
            {deadline.urgent ? (
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            ) : (
              <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{deadline.title}</p>
              <p className="text-xs text-muted-foreground">{deadline.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
