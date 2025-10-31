"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Shield,
  Moon,
  HelpCircle,
  FileText,
  Camera,
  User,
  Mail,
  Phone,
  Globe,
  LogOut,
  Settings,
} from "lucide-react"
import { useState } from "react"

export function ProfileScreen() {
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)

  const menuSections = [
    {
      title: "Información de Cuenta",
      items: [
        { icon: User, label: "Editar Perfil", subtitle: "Nombre, bio, foto", hasArrow: true },
        { icon: Mail, label: "Email", subtitle: "workill@example.com", hasArrow: true },
        { icon: Phone, label: "Teléfono", subtitle: "+1 234 567 8900", hasArrow: true },
      ],
    },
    {
      title: "Preferencias",
      items: [
        {
          icon: Bell,
          label: "Notificaciones",
          hasToggle: true,
          toggleValue: notifications,
          onToggle: setNotifications,
        },
        { icon: Moon, label: "Modo Oscuro", hasToggle: true, toggleValue: darkMode, onToggle: setDarkMode },
        { icon: Globe, label: "Idioma", subtitle: "Español", hasArrow: true },
        { icon: Settings, label: "Accesibilidad", hasArrow: true },
      ],
    },
    {
      title: "Seguridad",
      items: [{ icon: Shield, label: "Privacidad y Seguridad", hasArrow: true }],
    },
    {
      title: "Soporte",
      items: [
        { icon: HelpCircle, label: "Centro de Ayuda", hasArrow: true },
        { icon: FileText, label: "Términos y Condiciones", hasArrow: true },
        { icon: LogOut, label: "Cerrar Sesión", isDestructive: true },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-card/95 backdrop-blur-sm px-4 py-4 border-b border-border">
        <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary/50 transition-colors">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Configuración de Perfil</h1>
      </div>

      {/* Profile Avatar Section */}
      <div className="flex flex-col items-center py-8 px-4 border-b border-border">
        <div className="relative">
          <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-lg shadow-primary/10">
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-4xl font-semibold">
              W
            </AvatarFallback>
          </Avatar>
          <button className="absolute bottom-0 right-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 hover:scale-105">
            <Camera className="h-5 w-5 text-primary-foreground" />
          </button>
        </div>
        <h2 className="text-xl font-semibold text-foreground mt-4">WORKILL3199</h2>
      </div>

      {/* Menu Sections */}
      <div className="px-4 py-6 space-y-6">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              {section.title}
            </h3>
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  <button
                    className={`w-full flex items-center justify-between px-4 py-4 hover:bg-secondary/30 transition-all ${
                      item.highlight ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                          item.isDestructive ? "bg-destructive/10" : item.highlight ? "bg-primary/20" : "bg-secondary"
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 ${
                            item.isDestructive
                              ? "text-destructive"
                              : item.highlight
                                ? "text-primary"
                                : "text-foreground"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col items-start">
                        <span
                          className={`text-base font-medium ${
                            item.isDestructive ? "text-destructive" : "text-foreground"
                          }`}
                        >
                          {item.label}
                        </span>
                        {item.subtitle && <span className="text-sm text-muted-foreground">{item.subtitle}</span>}
                      </div>
                    </div>
                    {item.hasArrow && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                    {item.hasToggle && (
                      <Switch
                        checked={item.toggleValue}
                        onCheckedChange={item.onToggle}
                        className="data-[state=checked]:bg-primary"
                      />
                    )}
                  </button>
                  {itemIndex < section.items.length - 1 && <div className="h-px bg-border mx-4" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center py-8 px-4 text-center">
        <p className="text-xs text-muted-foreground">Versión 2.4.1</p>
        <p className="text-xs text-muted-foreground mt-1">© 2025 Tu App. Todos los derechos reservados.</p>
      </div>
    </div>
  )
}
