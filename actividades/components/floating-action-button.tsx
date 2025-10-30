"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function FloatingActionButton() {
  return (
    <Button
      size="icon"
      className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110"
    >
      <Plus className="h-6 w-6" />
    </Button>
  )
}
