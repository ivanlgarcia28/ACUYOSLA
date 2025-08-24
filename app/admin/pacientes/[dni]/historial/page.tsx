"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, User, FileText } from "lucide-react"

interface Turno {
  id: number
  fecha_horario_inicio: string
  fecha_horario_fin: string
  estado: string
  tratamientos: {
    nombre: string
    descripcion: string
    duracion_minutos: number
  }
}

interface Paciente {
  dni: string
  nombre_apellido: string
  email: string
  telefono: string
  obras_sociales: {
    nombre: string
  }
}

export default function HistorialPaciente() {
  const params = useParams()
  const router = useRouter()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchPacienteYTurnos()
  }, [params.dni])

  const fetchPacienteYTurnos = async () => {
    try {
      setLoading(true)

      // Obtener datos del paciente
      const { data: pacienteData, error: pacienteError } = await supabase
        .from("pacientes")
        .select(`
          dni,
          nombre_apellido,
          email,
          telefono,
          obras_sociales (
            nombre
          )
        `)
        .eq("dni", params.dni)
        .single()

      if (pacienteError) throw pacienteError
      setPaciente(pacienteData)

      // Obtener historial de turnos
      const { data: turnosData, error: turnosError } = await supabase
        .from("turnos")
        .select(`
          id,
          fecha_horario_inicio,
          fecha_horario_fin,
          estado,
          tratamientos (
            nombre,
            descripcion,
            duracion_minutos
          )
        `)
        .eq("paciente_dni", params.dni)
        .order("fecha_horario_inicio", { ascending: false })

      if (turnosError) throw turnosError
      setTurnos(turnosData || [])
    } catch (error: any) {
      console.error("Error fetching data:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const estadoConfig = {
      reservado: { color: "bg-yellow-100 text-yellow-800", label: "Reservado" },
      confirmado: { color: "bg-blue-100 text-blue-800", label: "Confirmado" },
      reprogramado: { color: "bg-orange-100 text-orange-800", label: "Reprogramado" },
      cancelado: { color: "bg-red-100 text-red-800", label: "Cancelado" },
      asistio: { color: "bg-green-100 text-green-800", label: "Asistió" },
      no_asistio_con_justificativo: { color: "bg-purple-100 text-purple-800", label: "No asistió (justificado)" },
      no_asistio_sin_justificativo: { color: "bg-red-100 text-red-800", label: "No asistió (sin justificar)" },
      cancelado_paciente: { color: "bg-gray-100 text-gray-800", label: "Cancelado por paciente" },
      cancelado_consultorio: { color: "bg-gray-100 text-gray-800", label: "Cancelado por consultorio" },
    }

    const config = estadoConfig[estado as keyof typeof estadoConfig] || {
      color: "bg-gray-100 text-gray-800",
      label: estado,
    }

    return <Badge className={config.color}>{config.label}</Badge>
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando historial...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={() => router.back()} className="mt-4">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/admin/pacientes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Pacientes
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Turnos</h1>
          <p className="text-gray-600">Registro completo de citas médicas</p>
        </div>
      </div>

      {paciente && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>Nombre:</strong> {paciente.nombre_apellido}
                </p>
                <p>
                  <strong>DNI:</strong> {paciente.dni}
                </p>
              </div>
              <div>
                <p>
                  <strong>Email:</strong> {paciente.email}
                </p>
                <p>
                  <strong>Teléfono:</strong> {paciente.telefono}
                </p>
                <p>
                  <strong>Obra Social:</strong> {paciente.obras_sociales?.nombre}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Historial de Turnos ({turnos.length})</h2>
        </div>

        {turnos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay turnos registrados para este paciente</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {turnos.map((turno) => (
              <Card key={turno.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{formatFecha(turno.fecha_horario_inicio)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>
                            {formatHora(turno.fecha_horario_inicio)} - {formatHora(turno.fecha_horario_fin)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{turno.tratamientos?.nombre}</span>
                        <span className="text-gray-500">({turno.tratamientos?.duracion_minutos} min)</span>
                      </div>

                      {turno.tratamientos?.descripcion && (
                        <p className="text-gray-600 text-sm">{turno.tratamientos.descripcion}</p>
                      )}
                    </div>

                    <div className="ml-4">{getEstadoBadge(turno.estado)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
