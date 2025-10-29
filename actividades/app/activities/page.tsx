"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BottomNav } from "@/components/bottom-nav"
import { FileText, Plus, Search, X, CheckCircle2, Circle, ChevronRight } from "lucide-react"

interface Activity {
  id: string
  title: string
  description: string
  className: string
  classColor: string
  dueDate: string
  status: "pending" | "completed" | "overdue"
  priority: "low" | "medium" | "high"
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: "1",
      title: "Prototipo de alta fidelidad",
      description: "Crear los mockups y prototipos de la pantalla principal.",
      className: "Diseño UX/UI",
      classColor: "bg-gradient-to-r from-blue-500 to-blue-600",
      dueDate: "2024-01-25",
      status: "pending",
      priority: "high",
    },
    {
      id: "2",
      title: "Investigación sobre React Hooks",
      description: "Leer la documentación y preparar un resumen.",
      className: "Frontend",
      classColor: "bg-gradient-to-r from-purple-500 to-purple-600",
      dueDate: "2024-01-22",
      status: "pending",
      priority: "medium",
    },
    {
      id: "3",
      title: "Definir paleta de colores",
      description: "Seleccionar colores primarios y secundarios para la app.",
      className: "Diseño UX/UI",
      classColor: "bg-gradient-to-r from-blue-500 to-blue-600",
      dueDate: "2024-01-26",
      status: "pending",
      priority: "medium",
    },
    {
      id: "4",
      title: "Configurar el entorno de desarrollo",
      description: "Instalar Node.js, Git y VS Code. General",
      className: "General",
      classColor: "bg-gradient-to-r from-green-500 to-green-600",
      dueDate: "2024-01-20",
      status: "completed",
      priority: "low",
    },
  ])

  const [showAddForm, setShowAddForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "overdue">("all")
  const [newActivity, setNewActivity] = useState({
    title: "",
    description: "",
    className: "",
    dueDate: "",
  })

  const toggleActivityStatus = (id: string) => {
    setActivities(
      activities.map((activity) =>
        activity.id === id
          ? {
              ...activity,
              status: activity.status === "completed" ? "pending" : "completed",
            }
          : activity,
      ),
    )
  }

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.className.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || activity.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(date)
    dueDate.setHours(0, 0, 0, 0)

    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Vence Hoy"
    if (diffDays === 1) return "Vence Mañana"
    if (diffDays < 0) return `Vence ${date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`
    return `Vence ${date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`
  }

  const getDueDateColor = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(date)
    dueDate.setHours(0, 0, 0, 0)

    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "bg-red-500/10 text-red-500 border-red-500/20"
    if (diffDays === 0) return "bg-red-500/10 text-red-500 border-red-500/20"
    if (diffDays === 1) return "bg-green-500/10 text-green-500 border-green-500/20"
    return "bg-green-500/10 text-green-500 border-green-500/20"
  }

  const handleAddActivity = () => {
    if (newActivity.title && newActivity.className && newActivity.dueDate) {
      const activity: Activity = {
        id: Date.now().toString(),
        title: newActivity.title,
        description: newActivity.description,
        className: newActivity.className,
        classColor: "bg-gradient-to-r from-blue-500 to-blue-600",
        dueDate: newActivity.dueDate,
        status: "pending",
        priority: "medium",
      }
      setActivities([...activities, activity])
      setNewActivity({ title: "", description: "", className: "", dueDate: "" })
      setShowAddForm(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md">
        <header className="border-b border-border/40 bg-card/50 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Actividades</h1>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-9 gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold shadow-sm hover:bg-blue-700"
            >
              {showAddForm ? (
                <>
                  <X className="h-3.5 w-3.5" />
                  Cancelar
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Agregar
                </>
              )}
            </Button>
          </div>
        </header>

        <main className="space-y-4 px-5 py-4">
          {showAddForm && (
            <Card className="border-border/50 bg-card/50 p-4 shadow-md backdrop-blur-sm">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="activityTitle" className="text-xs font-medium">
                    Título
                  </Label>
                  <Input
                    id="activityTitle"
                    placeholder="ej., Prototipo de alta fidelidad"
                    value={newActivity.title}
                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="activityClass" className="text-xs font-medium">
                    Clase
                  </Label>
                  <Input
                    id="activityClass"
                    placeholder="ej., Diseño UX/UI"
                    value={newActivity.className}
                    onChange={(e) => setNewActivity({ ...newActivity, className: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="activityDescription" className="text-xs font-medium">
                    Descripción
                  </Label>
                  <Textarea
                    id="activityDescription"
                    placeholder="Agregar detalles..."
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                    className="min-h-20 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="activityDueDate" className="text-xs font-medium">
                    Fecha de vencimiento
                  </Label>
                  <Input
                    id="activityDueDate"
                    type="date"
                    value={newActivity.dueDate}
                    onChange={(e) => setNewActivity({ ...newActivity, dueDate: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
                <Button
                  onClick={handleAddActivity}
                  className="h-10 w-full text-sm shadow-sm"
                  disabled={!newActivity.title || !newActivity.className || !newActivity.dueDate}
                >
                  Agregar Actividad
                </Button>
              </div>
            </Card>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar actividades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-lg border-border/40 bg-card/30 pl-10 text-sm backdrop-blur-sm"
            />
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter("all")}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                statusFilter === "all"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-card/50 text-muted-foreground hover:bg-card/80"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                statusFilter === "pending"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-card/50 text-muted-foreground hover:bg-card/80"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                statusFilter === "completed"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-card/50 text-muted-foreground hover:bg-card/80"
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter("overdue")}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                statusFilter === "overdue"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-card/50 text-muted-foreground hover:bg-card/80"
              }`}
            >
              Overdue
            </button>
          </div>

          <div className="space-y-3">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-200 hover:border-border/60 hover:shadow-lg"
              >
                <div
                  className={`absolute left-0 top-0 h-full w-1 ${
                    activity.priority === "high"
                      ? "bg-gradient-to-b from-red-500 to-red-600"
                      : activity.priority === "medium"
                        ? "bg-gradient-to-b from-yellow-500 to-yellow-600"
                        : "bg-gradient-to-b from-blue-500 to-blue-600"
                  }`}
                />

                <div className="flex items-start gap-3 p-4 pl-5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleActivityStatus(activity.id)
                    }}
                    className="shrink-0 transition-transform hover:scale-110 active:scale-95"
                  >
                    {activity.status === "completed" ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-border/60 bg-background/50">
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />
                      </div>
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="space-y-1">
                      <h3
                        className={`text-sm font-semibold leading-tight ${
                          activity.status === "completed" ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        {activity.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`flex items-center gap-1.5 rounded-md ${activity.classColor} px-2.5 py-1`}>
                        <span className="text-xs font-semibold text-white">{activity.className}</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 ${getDueDateColor(activity.dueDate)}`}
                      >
                        <span className="text-xs font-semibold">{formatDueDate(activity.dueDate)}</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}

            {filteredActivities.length === 0 && (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No se encontraron actividades</p>
                <p className="mt-1 text-xs text-muted-foreground/70">Intenta con otra búsqueda</p>
              </div>
            )}
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  )
}
