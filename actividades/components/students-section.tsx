import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function StudentsSection() {
  const students = [
    { name: "María García", status: "Activo", avatar: "MG", progress: 92 },
    { name: "Juan Pérez", status: "Activo", avatar: "JP", progress: 85 },
    { name: "Ana López", status: "Pendiente", avatar: "AL", progress: 67 },
  ]

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-accent/10 p-1.5">
              <Users className="h-3.5 w-3.5 text-accent" />
            </div>
            <CardTitle className="text-sm">Estudiantes</CardTitle>
          </div>
          <Badge variant="secondary" className="rounded-full text-xs px-2 py-0">
            {students.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4">
        {students.map((student) => (
          <div
            key={student.name}
            className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`/.jpg?height=32&width=32&query=${student.name}`} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">{student.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-medium">{student.name}</p>
                <p className="text-[10px] text-muted-foreground">{student.progress}% completado</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
