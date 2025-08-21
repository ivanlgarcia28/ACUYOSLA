"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface ObraSocial {
  id: number
  nombre: string
}

interface Paciente {
  id: number
  nombre_apellido: string
  dni: string
  email: string
  telefono: string
  obra_social: number
}

export default function EditarPacientePage() {
  const router = useRouter()
  const params = useParams()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPaciente()
    fetchObrasSociales()
  }, [])

  const fetchPaciente = async () => {
    try {
      const { data, error } = await supabase.from("pacientes").select("*").eq("id", params.id).single()

      if (error) throw error
      setPaciente(data)
    } catch (error) {
      console.error("Error fetching paciente:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchObrasSociales = async () => {
    try {
      const { data, error } = await supabase.from("obras_sociales").select("*").order("nombre", { ascending: true })

      if (error) throw error
      setObrasSociales(data || [])
    } catch (error) {
      console.error("Error fetching obras sociales:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paciente) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("pacientes")
        .update({
          nombre_apellido: paciente.nombre_apellido,
          dni: paciente.dni,
          email: paciente.email,
          telefono: paciente.telefono,
          obra_social: paciente.obra_social,
        })
        .eq("id", paciente.id)

      if (error) throw error

      router.push("/admin/pacientes")
    } catch (error) {
      console.error("Error updating paciente:", error)
      alert("Error al actualizar el paciente")
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Paciente no encontrado</h2>
          <Link href="/admin/pacientes">
            <Button className="mt-4">Volver a Pacientes</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href="/admin/pacientes">
          <Button variant="outline" size="sm" className="mr-4 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Paciente</h1>
          <p className="text-gray-600">Modificar información del paciente</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="nombre_apellido">Nombre y Apellido *</Label>
              <Input
                id="nombre_apellido"
                value={paciente.nombre_apellido}
                onChange={(e) => setPaciente({ ...paciente, nombre_apellido: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="dni">DNI *</Label>
              <Input
                id="dni"
                value={paciente.dni}
                onChange={(e) => setPaciente({ ...paciente, dni: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={paciente.email}
                onChange={(e) => setPaciente({ ...paciente, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={paciente.telefono}
                onChange={(e) => setPaciente({ ...paciente, telefono: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="obra_social">Obra Social *</Label>
              <Select
                value={paciente.obra_social.toString()}
                onValueChange={(value) => setPaciente({ ...paciente, obra_social: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar obra social" />
                </SelectTrigger>
                <SelectContent>
                  {obrasSociales.map((obra) => (
                    <SelectItem key={obra.id} value={obra.id.toString()}>
                      {obra.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/admin/pacientes">
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
