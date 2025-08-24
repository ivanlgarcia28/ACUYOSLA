"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NuevoTratamientoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [insumos, setInsumos] = useState([])

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    duracion_minutos: 60,
    insumos_id: "0", // Updated default value to be a non-empty string
  })

  useEffect(() => {
    fetchInsumos()
  }, [])

  const fetchInsumos = async () => {
    const { data } = await supabase.from("insumos").select("*").order("nombre")

    if (data) setInsumos(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("tratamientos").insert([
        {
          ...formData,
          insumos_id: formData.insumos_id ? Number.parseInt(formData.insumos_id) : null,
        },
      ])

      if (error) throw error

      router.push("/admin/tratamientos")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al crear tratamiento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tratamientos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Tratamiento</h1>
          <p className="text-gray-600">Agregar un nuevo tratamiento al sistema</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Tratamiento</CardTitle>
          <CardDescription>Complete todos los campos requeridos</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre del Tratamiento *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duracion_minutos">Duración (minutos) *</Label>
                <Input
                  id="duracion_minutos"
                  type="number"
                  value={formData.duracion_minutos}
                  onChange={(e) => setFormData({ ...formData, duracion_minutos: Number.parseInt(e.target.value) })}
                  min="15"
                  step="15"
                  required
                />
              </div>

              <div>
                <Label htmlFor="insumos_id">Insumos Necesarios</Label>
                <Select
                  value={formData.insumos_id}
                  onValueChange={(value) => setFormData({ ...formData, insumos_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar insumos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sin insumos específicos</SelectItem>{" "}
                    {/* Updated value prop to be a non-empty string */}
                    {insumos.map((insumo: any) => (
                      <SelectItem key={insumo.id} value={insumo.id.toString()}>
                        {insumo.nombre} ({insumo.cantidad_necesaria} {insumo.unidad_medida})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Crear Tratamiento"}
              </Button>
              <Link href="/admin/tratamientos">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
