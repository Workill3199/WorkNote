"use client"

import { Home, BookOpen, Settings, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { icon: Home, label: "Inicio", href: "/", active: pathname === "/" },
    { icon: BookOpen, label: "Clases", href: "/classes", active: pathname === "/classes" },
    { icon: FileText, label: "Actividades", href: "/activities", active: pathname === "/activities" },
    { icon: Settings, label: "Ajustes", href: "/settings", active: pathname === "/settings" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-[#0a0e1a]/98 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-3">
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            size="sm"
            asChild
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-all duration-200 ${
              item.active
                ? "text-primary bg-primary/10 rounded-xl"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </nav>
  )
}
