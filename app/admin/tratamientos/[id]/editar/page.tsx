"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface Insumo {
  id: number
  nombre: string
}

interface Tratamiento {
  id: number
  nombre: string
  descripcion: string
  duracion_minutos: number
  insumos_id: number
}

export default function EditarTratamientoPage() {
  const router = useRouter()
  const params = useParams()
  const [tratamiento, setTratamiento] = useState<Tratamiento | null>(null)
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTratamiento()
    fetchInsumos()
  }, [])

  const fetchTratamiento = async () => {
    try {
      const { data, error } = await supabase.from("tratamientos").select("*").eq("id", params.id).single()

      if (error) throw error
      setTratamiento(data)
    } catch (error) {
      console.error("Error fetching tratamiento:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInsumos = async () => {
    try {
      const { data, error } = await supabase.from("insumos").select("id, nombre").order("nombre", { ascending: true })

      if (error) throw error
      setInsumos(data || [])
    } catch (error) {
      console.error("Error fetching insumos:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tratamiento) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("tratamientos")
        .update({
          nombre: tratamiento.nombre,
          descripcion: tratamiento.descripcion,
          duracion_minutos: tratamiento.duracion_minutos,
          insumos_id: tratamiento.insumos_id,
        })
        .eq("id", tratamiento.id)

      if (error) throw error

      router.push("/admin/tratamientos")
    } catch (error) {
      console.error("Error updating tratamiento:", error)
      alert("Error al actualizar el tratamiento")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!tratamiento) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Tratamiento no encontrado</h2>
          <Link href="/admin/tratamientos">
            <Button className="mt-4">Volver a Tratamientos</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href="/admin/tratamientos">
          <Button variant="outline" size="sm" className="mr-4 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Tratamiento</h1>
          <p className="text-gray-600">Modificar información del tratamiento</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="nombre">Nombre del Tratamiento *</Label>
            <Input
              id="nombre"
              value={tratamiento.nombre}
              onChange={(e) => setTratamiento({ ...tratamiento, nombre: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={tratamiento.descripcion}
              onChange={(e) => setTratamiento({ ...tratamiento, descripcion: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="duracion_minutos">Duración (minutos) *</Label>
            <Input
              id="duracion_minutos"
              type="number"
              min="1"
              value={tratamiento.duracion_minutos}
              onChange={(e) => setTratamiento({ ...tratamiento, duracion_minutos: Number.parseInt(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="insumos_id">Insumos Necesarios</Label>
            <Select
              value={tratamiento.insumos_id?.toString() || ""}
              onValueChange={(value) => setTratamiento({ ...tratamiento, insumos_id: Number.parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar insumos" />
              </SelectTrigger>
              <SelectContent>
                {insumos.map((insumo) => (
                  <SelectItem key={insumo.id} value={insumo.id.toString()}>
                    {insumo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/admin/tratamientos">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
