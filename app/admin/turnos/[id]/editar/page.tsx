"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface Paciente {
  dni: string
  nombre_apellido: string
}

interface Tratamiento {
  id: number
  nombre: string
}

interface Turno {
  id: number
  paciente_dni: string
  tratamiento_id: number
  fecha_horario_inicio: string
  fecha_horario_fin: string
  estado: string
  calendar_id: string
}

export default function EditarTurnoPage() {
  const router = useRouter()
  const params = useParams()
  const [turno, setTurno] = useState<Turno | null>(null)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const formatDateTimeForInput = (utcDateString: string) => {
    const date = new Date(utcDateString)
    // Convert to local timezone for display
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return localDate.toISOString().slice(0, 16)
  }

  const convertToUTC = (localDateString: string) => {
    const localDate = new Date(localDateString)
    // Convert back to UTC for storage
    return new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000).toISOString()
  }

  useEffect(() => {
    fetchTurno()
    fetchPacientes()
    fetchTratamientos()
  }, [])

  const fetchTurno = async () => {
    try {
      const { data, error } = await supabase.from("turnos").select("*").eq("id", params.id).single()

      if (error) throw error
      setTurno(data)
    } catch (error) {
      console.error("Error fetching turno:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPacientes = async () => {
    try {
      const { data, error } = await supabase
        .from("pacientes")
        .select("dni, nombre_apellido")
        .order("nombre_apellido", { ascending: true })

      if (error) throw error
      setPacientes(data || [])
    } catch (error) {
      console.error("Error fetching pacientes:", error)
    }
  }

  const fetchTratamientos = async () => {
    try {
      const { data, error } = await supabase
        .from("tratamientos")
        .select("id, nombre")
        .order("nombre", { ascending: true })

      if (error) throw error
      setTratamientos(data || [])
    } catch (error) {
      console.error("Error fetching tratamientos:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!turno) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("turnos")
        .update({
          paciente_dni: turno.paciente_dni,
          tratamiento_id: turno.tratamiento_id,
          fecha_horario_inicio: convertToUTC(turno.fecha_horario_inicio),
          fecha_horario_fin: convertToUTC(turno.fecha_horario_fin),
          estado: turno.estado,
        })
        .eq("id", turno.id)

      if (error) throw error

      router.push("/admin/turnos")
    } catch (error) {
      console.error("Error updating turno:", error)
      alert("Error al actualizar el turno")
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

  if (!turno) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Turno no encontrado</h2>
          <Link href="/admin/turnos">
            <Button className="mt-4">Volver a Turnos</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href="/admin/turnos">
          <Button variant="outline" size="sm" className="mr-4 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Turno</h1>
          <p className="text-gray-600">Modificar información del turno</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="paciente_dni">Paciente *</Label>
              <Select value={turno.paciente_dni} onValueChange={(value) => setTurno({ ...turno, paciente_dni: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((paciente) => (
                    <SelectItem key={paciente.dni} value={paciente.dni}>
                      {paciente.nombre_apellido} - DNI: {paciente.dni}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tratamiento_id">Tratamiento *</Label>
              <Select
                value={turno.tratamiento_id.toString()}
                onValueChange={(value) => setTurno({ ...turno, tratamiento_id: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tratamiento" />
                </SelectTrigger>
                <SelectContent>
                  {tratamientos.map((tratamiento) => (
                    <SelectItem key={tratamiento.id} value={tratamiento.id.toString()}>
                      {tratamiento.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fecha_horario_inicio">Fecha y Hora de Inicio *</Label>
              <Input
                id="fecha_horario_inicio"
                type="datetime-local"
                value={formatDateTimeForInput(turno.fecha_horario_inicio)}
                onChange={(e) => setTurno({ ...turno, fecha_horario_inicio: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="fecha_horario_fin">Fecha y Hora de Fin *</Label>
              <Input
                id="fecha_horario_fin"
                type="datetime-local"
                value={formatDateTimeForInput(turno.fecha_horario_fin)}
                onChange={(e) => setTurno({ ...turno, fecha_horario_fin: e.target.value })}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="estado">Estado *</Label>
              <Select value={turno.estado} onValueChange={(value) => setTurno({ ...turno, estado: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="reprogramado">Reprogramado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="asistio">Asistió</SelectItem>
                  <SelectItem value="no_asistio_con_justificativo">No asistió (con justificativo)</SelectItem>
                  <SelectItem value="no_asistio_sin_justificativo">No asistió (sin justificativo)</SelectItem>
                  <SelectItem value="cancelado_paciente">Cancelado por paciente</SelectItem>
                  <SelectItem value="cancelado_consultorio">Cancelado por consultorio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/admin/turnos">
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
