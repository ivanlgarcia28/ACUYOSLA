"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/client"

export default function NuevaObraSocialPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    activa: true,
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("obras_sociales").insert([formData])

      if (error) throw error

      router.push("/admin/obras-sociales")
    } catch (error) {
      console.error("Error creating obra social:", error)
      alert("Error al crear la obra social")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Obra Social</h1>
        <p className="text-gray-600">Agregar una nueva obra social al sistema</p>
      </div>

      <div className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              placeholder="Ej: OSDE, Swiss Medical, etc."
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="activa"
              type="checkbox"
              checked={formData.activa}
              onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="activa">Obra social activa</Label>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Crear Obra Social"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
