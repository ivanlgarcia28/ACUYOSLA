"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, FileText } from "lucide-react"
import { createClient } from "@/lib/client"

interface Turno {
  id: number
  fecha_horario_inicio: string
  fecha_horario_fin: string
  estado: string
  tratamientos: {
    nombre: string
    descripcion: string
  }
}

export default function PacienteDashboard() {
  const [paciente, setPaciente] = useState<any>(null)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const pacienteData = sessionStorage.getItem("paciente")
    if (pacienteData) {
      const p = JSON.parse(pacienteData)
      setPaciente(p)
      fetchTurnos(p.dni)
    }
  }, [])

  const fetchTurnos = async (dni: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("turnos")
        .select(`
          id,
          fecha_horario_inicio,
          fecha_horario_fin,
          estado,
          tratamientos (
            nombre,
            descripcion
          )
        `)
        .eq("paciente_dni", dni)
        .order("fecha_horario_inicio", { ascending: false })

      if (error) throw error
      setTurnos(data || [])
    } catch (error) {
      console.error("Error fetching turnos:", error)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const colors = {
      confirmado: "bg-blue-100 text-blue-800",
      completado: "bg-green-100 text-green-800",
      asistio: "bg-green-100 text-green-800",
      no_asistio_con_justificativo: "bg-yellow-100 text-yellow-800",
      no_asistio_sin_justificativo: "bg-red-100 text-red-800",
      cancelado_paciente: "bg-gray-100 text-gray-800",
      cancelado_consultorio: "bg-gray-100 text-gray-800",
      reprogramado: "bg-purple-100 text-purple-800",
    }
    return colors[estado as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <User className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {paciente?.nombre_apellido}</h1>
          <p className="text-gray-600">DNI: {paciente?.dni}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Turnos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{turnos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Turno</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {turnos.find((t) => new Date(t.fecha_horario_inicio) > new Date() && t.estado === "confirmado") ? (
              <div className="text-sm">
                {formatDate(
                  turnos.find((t) => new Date(t.fecha_horario_inicio) > new Date() && t.estado === "confirmado")!
                    .fecha_horario_inicio,
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No hay turnos próximos</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tratamientos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(turnos.map((t) => t.tratamientos?.nombre)).size}</div>
            <p className="text-xs text-muted-foreground">Tipos diferentes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Turnos</CardTitle>
          <CardDescription>Todos sus turnos y tratamientos realizados</CardDescription>
        </CardHeader>
        <CardContent>
          {turnos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay turnos registrados</div>
          ) : (
            <div className="space-y-4">
              {turnos.map((turno) => (
                <div key={turno.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{formatDate(turno.fecha_horario_inicio)}</span>
                        <Clock className="h-4 w-4 text-gray-500 ml-4" />
                        <span>
                          {formatTime(turno.fecha_horario_inicio)} - {formatTime(turno.fecha_horario_fin)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {turno.tratamientos?.nombre || "Tratamiento no especificado"}
                        </p>
                        {turno.tratamientos?.descripcion && (
                          <p className="text-sm text-gray-600">{turno.tratamientos.descripcion}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={getEstadoBadge(turno.estado)}>{turno.estado.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
