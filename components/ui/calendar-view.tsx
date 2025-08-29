"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar, Clock, User } from "lucide-react"

interface CalendarTurno {
  id: number
  fecha_horario_inicio: string
  fecha_horario_fin: string
  estado: string
  tipo_turno?: string
  pacientes?: {
    nombre_apellido: string
  }
  tratamientos?: {
    nombre: string
  }
  paciente_dni?: string
  tratamiento_id?: number
}

interface CalendarViewProps {
  onTurnoClick?: (turno: CalendarTurno) => void
  patientDni?: string // Optional filter for patient-specific view
}

export default function CalendarView({ onTurnoClick, patientDni }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day">("month")
  const [turnos, setTurnos] = useState<CalendarTurno[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchTurnos = async () => {
    setLoading(true)
    try {
      console.log("[v0] Fetching turnos for calendar view...")

      let startDate: Date
      let endDate: Date

      if (view === "month") {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)
      } else if (view === "week") {
        const dayOfWeek = currentDate.getDay()
        const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        startDate = new Date(currentDate.setDate(diff))
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 4) // Only 5 working days (Mon-Fri)
        endDate.setHours(23, 59, 59)
      } else {
        startDate = new Date(currentDate)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(currentDate)
        endDate.setHours(23, 59, 59)
      }

      console.log("[v0] Date range:", startDate.toISOString(), "to", endDate.toISOString())

      let query = supabase
        .from("turnos")
        .select(`
          id,
          fecha_horario_inicio,
          fecha_horario_fin,
          estado,
          tipo_turno,
          paciente_dni,
          tratamiento_id,
          pacientes(nombre_apellido),
          tratamientos(nombre)
        `)
        .gte("fecha_horario_inicio", startDate.toISOString())
        .lte("fecha_horario_inicio", endDate.toISOString())
        .neq("estado", "cancelado")
        .neq("estado", "reprogramado_paciente")
        .order("fecha_horario_inicio")

      if (patientDni) {
        query = query.eq("paciente_dni", patientDni)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error fetching turnos:", error)
        setTurnos([])
        return
      }

      console.log("[v0] Fetched turnos:", data?.length || 0)
      setTurnos(data || [])
    } catch (error) {
      console.error("[v0] Error in fetchTurnos:", error)
      setTurnos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTurnos()
  }, [currentDate, view, patientDni])

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)

    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
    }

    setCurrentDate(newDate)
  }

  const getEstadoColor = (estado: string) => {
    const colors = {
      reservado: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmado_paciente: "bg-blue-100 text-blue-800 border-blue-200",
      confirmado_clinica: "bg-green-100 text-green-800 border-green-200",
      en_curso: "bg-purple-100 text-purple-800 border-purple-200",
      completado: "bg-gray-100 text-gray-800 border-gray-200",
      no_asistio: "bg-red-100 text-red-800 border-red-200",
    }
    return colors[estado as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDateObj = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      const dayTurnos = turnos.filter(
        (turno) => new Date(turno.fecha_horario_inicio).toDateString() === currentDateObj.toDateString(),
      )

      days.push(
        <div
          key={i}
          className={`min-h-[120px] p-2 border border-gray-200 ${
            currentDateObj.getMonth() !== currentDate.getMonth() ? "bg-gray-50 text-gray-400" : "bg-white"
          }`}
        >
          <div className="font-medium text-sm mb-1">{currentDateObj.getDate()}</div>
          <div className="space-y-1">
            {dayTurnos.slice(0, 3).map((turno) => (
              <div
                key={turno.id}
                className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getEstadoColor(turno.estado)}`}
                onClick={() => onTurnoClick?.(turno)}
              >
                <div className="font-medium truncate">
                  {new Date(turno.fecha_horario_inicio).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="truncate">{turno.pacientes?.nombre_apellido || `DNI: ${turno.paciente_dni}`}</div>
              </div>
            ))}
            {dayTurnos.length > 3 && <div className="text-xs text-gray-500">+{dayTurnos.length - 3} más</div>}
          </div>
        </div>,
      )

      currentDateObj.setDate(currentDateObj.getDate() + 1)
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
          <div key={day} className="p-3 bg-gray-100 font-medium text-center text-sm border-b">
            {day}
          </div>
        ))}
        {days}
      </div>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)

    const weekDays = []
    for (let i = 0; i < 5; i++) {
      // Only 5 working days
      const currentDay = new Date(startOfWeek)
      currentDay.setDate(startOfWeek.getDate() + i)
      weekDays.push(currentDay)
    }

    return (
      <div className="grid grid-cols-6 gap-0 border border-gray-200">
        {" "}
        {/* Changed from 8 to 6 columns */}
        <div className="p-3 bg-gray-100 font-medium text-center text-sm border-b">Hora</div>
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="p-3 bg-gray-100 font-medium text-center text-sm border-b">
            <div>{day.toLocaleDateString("es-ES", { weekday: "short" })}</div>
            <div>{day.getDate()}</div>
          </div>
        ))}
        {Array.from({ length: 12 }, (_, hour) => {
          const timeSlot = hour + 8 // 8 AM to 8 PM
          return (
            <div key={timeSlot} className="contents">
              <div className="p-2 bg-gray-50 text-sm font-medium border-b text-center">{timeSlot}:00</div>
              {weekDays.map((day) => {
                const dayTurnos = turnos.filter((turno) => {
                  const turnoDate = new Date(turno.fecha_horario_inicio)
                  return turnoDate.toDateString() === day.toDateString() && turnoDate.getHours() === timeSlot
                })

                return (
                  <div key={`${day.toISOString()}-${timeSlot}`} className="min-h-[60px] p-1 border-b border-r">
                    {dayTurnos.map((turno) => (
                      <div
                        key={turno.id}
                        className={`text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80 ${getEstadoColor(turno.estado)}`}
                        onClick={() => onTurnoClick?.(turno)}
                      >
                        <div className="font-medium">
                          {turno.pacientes?.nombre_apellido || `DNI: ${turno.paciente_dni}`}
                        </div>
                        <div className="truncate">{turno.tratamientos?.nombre || `Trat. ${turno.tratamiento_id}`}</div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  const renderDayView = () => {
    const dayTurnos = turnos.filter(
      (turno) => new Date(turno.fecha_horario_inicio).toDateString() === currentDate.toDateString(),
    )

    return (
      <div className="space-y-2">
        {dayTurnos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay turnos programados para este día</div>
        ) : (
          dayTurnos.map((turno) => (
            <Card
              key={turno.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onTurnoClick?.(turno)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {new Date(turno.fecha_horario_inicio).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(turno.fecha_horario_fin).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{turno.pacientes?.nombre_apellido || `DNI: ${turno.paciente_dni}`}</span>
                    </div>
                  </div>
                  <Badge className={getEstadoColor(turno.estado)}>{turno.estado.replace("_", " ").toUpperCase()}</Badge>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {turno.tratamientos?.nombre || `Tratamiento ${turno.tratamiento_id}`} •{" "}
                  {turno.tipo_turno || "Consulta"}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    )
  }

  const getViewTitle = () => {
    if (view === "month") {
      return currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    } else if (view === "week") {
      const startOfWeek = new Date(currentDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 4) // Only 5 working days

      return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString("es-ES", { month: "long", year: "numeric" })} (Lun-Vie)`
    } else {
      return currentDate.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendario de Turnos
            {patientDni && <span className="text-sm font-normal text-gray-500">(Paciente: {patientDni})</span>}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex rounded-md border">
              <Button
                variant={view === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("month")}
                className="rounded-r-none"
              >
                Mes
              </Button>
              <Button
                variant={view === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("week")}
                className="rounded-none border-x-0"
              >
                Semana
              </Button>
              <Button
                variant={view === "day" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("day")}
                className="rounded-l-none"
              >
                Día
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold capitalize">{getViewTitle()}</h3>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {view === "month" && renderMonthView()}
            {view === "week" && renderWeekView()}
            {view === "day" && renderDayView()}
          </div>
        )}
        {!loading && turnos.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No se encontraron turnos para el período seleccionado
          </div>
        )}
      </CardContent>
    </Card>
  )
}
