"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User, CheckCircle, XCircle, Calendar, CreditCard } from "lucide-react"

interface TimelineEvent {
  id: number
  turno_id: number
  estado_anterior: string | null
  estado_nuevo: string
  comentario: string | null
  fecha_cambio: string
  usuario_id: string | null
  tipo_cambio: string
}

interface AppointmentTimelineProps {
  turnoId: number
}

export default function AppointmentTimeline({ turnoId }: AppointmentTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchTimeline()
  }, [turnoId])

  const fetchTimeline = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from("turnos_historial")
        .select("*")
        .eq("turno_id", turnoId)
        .order("fecha_cambio", { ascending: false })

      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching timeline:", error)
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (tipoChange: string, estadoNuevo: string) => {
    switch (tipoChange) {
      case "creacion":
        return <Calendar className="h-4 w-4 text-blue-500" />
      case "confirmacion":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "cancelacion":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pago":
        return <CreditCard className="h-4 w-4 text-purple-500" />
      case "estado":
        return <Clock className="h-4 w-4 text-orange-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getEventColor = (tipoChange: string) => {
    const colors = {
      creacion: "border-blue-200 bg-blue-50",
      confirmacion: "border-green-200 bg-green-50",
      cancelacion: "border-red-200 bg-red-50",
      pago: "border-purple-200 bg-purple-50",
      estado: "border-orange-200 bg-orange-50",
      reprogramacion: "border-yellow-200 bg-yellow-50",
    }
    return colors[tipoChange as keyof typeof colors] || "border-gray-200 bg-gray-50"
  }

  const getEstadoBadge = (estado: string) => {
    const variants = {
      reservado: "bg-yellow-100 text-yellow-800",
      confirmado_paciente: "bg-blue-100 text-blue-800",
      confirmado_clinica: "bg-green-100 text-green-800",
      en_curso: "bg-purple-100 text-purple-800",
      completado: "bg-gray-100 text-gray-800",
      cancelado: "bg-red-100 text-red-800",
      no_asistio: "bg-red-100 text-red-800",
    }
    return variants[estado as keyof typeof variants] || "bg-gray-100 text-gray-800"
  }

  const formatEventDescription = (event: TimelineEvent) => {
    switch (event.tipo_cambio) {
      case "creacion":
        return "Turno creado"
      case "confirmacion":
        return `Turno confirmado${event.estado_nuevo === "confirmado_clinica" ? " por la clínica" : " por el paciente"}`
      case "cancelacion":
        return "Turno cancelado"
      case "pago":
        return "Pago registrado"
      case "estado":
        return `Estado cambiado de "${event.estado_anterior}" a "${event.estado_nuevo}"`
      case "reprogramacion":
        return "Turno reprogramado"
      default:
        return "Evento registrado"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial del Turno</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial del Turno</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay eventos registrados</p>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="relative">
                {index < events.length - 1 && <div className="absolute left-6 top-8 w-0.5 h-8 bg-gray-200"></div>}
                <div className={`flex items-start space-x-3 p-3 rounded-lg border ${getEventColor(event.tipo_cambio)}`}>
                  <div className="flex-shrink-0 mt-0.5">{getEventIcon(event.tipo_cambio, event.estado_nuevo)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{formatEventDescription(event)}</p>
                      <Badge className={getEstadoBadge(event.estado_nuevo)}>
                        {event.estado_nuevo.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                    {event.comentario && <p className="text-sm text-gray-600 mt-1">{event.comentario}</p>}
                    <p className="text-xs text-gray-500 mt-1">{new Date(event.fecha_cambio).toLocaleString("es-ES")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
