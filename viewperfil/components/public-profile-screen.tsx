"use client"

import { ArrowLeft, BookOpen, Share2, Mail, Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function PublicProfileScreen() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0f1420]/80 backdrop-blur-md border-b border-blue-500/10">
        <div className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
          <button className="p-2 hover:bg-blue-500/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Perfil de Usuario</h1>
          <button className="p-2 hover:bg-blue-500/10 rounded-full transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-8">
        {/* Profile Header */}
        <div className="pt-8 pb-6 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-4xl font-bold shadow-lg shadow-blue-500/30">
              W
            </div>
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#0a0e1a]"></div>
          </div>

          <h2 className="text-2xl font-bold mb-6">WORKILL3199</h2>
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>
          <div className="bg-gradient-to-br from-[#1a1f35] to-[#0f1420] rounded-2xl border border-blue-500/10 overflow-hidden">
            <div className="flex items-center gap-4 p-4 hover:bg-blue-500/5 transition-colors border-b border-blue-500/10">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-0.5">Email</p>
                <p className="text-sm font-medium">workill3199@email.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 hover:bg-blue-500/5 transition-colors">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-0.5">Teléfono</p>
                <p className="text-sm font-medium">+54 11 1234-5678</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Courses */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Cursos en Progreso
          </h3>
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-[#1a1f35] to-[#0f1420] rounded-xl p-4 border border-blue-500/10">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold mb-1">Desarrollo Web Full Stack</h4>
                  <p className="text-xs text-gray-400">React, Node.js, MongoDB</p>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">En curso</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Progreso</span>
                  <span>68%</span>
                </div>
                <Progress value={68} className="h-2 bg-[#0f1420]" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a1f35] to-[#0f1420] rounded-xl p-4 border border-blue-500/10">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold mb-1">Inteligencia Artificial Aplicada</h4>
                  <p className="text-xs text-gray-400">Machine Learning, Python</p>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">En curso</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Progreso</span>
                  <span>42%</span>
                </div>
                <Progress value={42} className="h-2 bg-[#0f1420]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
