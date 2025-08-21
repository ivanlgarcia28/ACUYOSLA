"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Calendar, Clock } from "lucide-react"
import Link from "next/link"

interface Turno {
  id: number
  paciente_dni: string
  tratamiento_id: number
  fecha_horario_inicio: string
  fecha_horario_fin: string
  estado: string
  calendar_id: string
  pacientes?: {
    nombre_apellido: string
  }
  tratamientos?: {
    nombre: string
  }
}

interface TimeSlot {
  time: string
  available: boolean
  turno?: Turno
  isFirstSlot?: boolean
  isContinuation?: boolean
}

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "daily">("list")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [dailySlots, setDailySlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    fetchTurnos()
  }, [])

  useEffect(() => {
    if (viewMode === "daily") {
      generateDailySlots()
    }
  }, [selectedDate, turnos, viewMode])

  const fetchTurnos = async () => {
    try {
      const { data, error } = await supabase
        .from("turnos")
        .select(`
          *,
          pacientes (
            nombre_apellido
          ),
          tratamientos (
            nombre
          )
        `)
        .order("fecha_horario_inicio", { ascending: true })

      if (error) throw error
      setTurnos(data || [])
    } catch (error) {
      console.error("Error fetching turnos:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateDailySlots = () => {
    const slots: TimeSlot[] = []
    const startHour = 8
    const endHour = 18
    const intervalMinutes = 30

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        slots.push({
          time: timeString,
          available: true,
          turno: undefined,
          isFirstSlot: false,
          isContinuation: false,
        })
      }
    }

    const selectedDateTurnos = turnos.filter((turno) => {
      const turnoStart = new Date(turno.fecha_horario_inicio)
      // Convert to local date string for comparison
      const turnoDateLocal = new Date(turnoStart.getTime() - turnoStart.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0]
      return turnoDateLocal === selectedDate
    })

    console.log("[v0] Selected date:", selectedDate)
    console.log("[v0] Found turnos for selected date:", selectedDateTurnos.length)

    selectedDateTurnos.forEach((turno) => {
      const turnoStart = new Date(turno.fecha_horario_inicio)
      const turnoEnd = new Date(turno.fecha_horario_fin)

      console.log("[v0] Processing turno:", {
        id: turno.id,
        start: turnoStart.toISOString(),
        end: turnoEnd.toISOString(),
      })

      let isFirstSlotForThisTurno = true

      slots.forEach((slot, index) => {
        const [slotHour, slotMinute] = slot.time.split(":").map(Number)
        const slotDateTime = new Date(turno.fecha_horario_inicio)
        slotDateTime.setHours(slotHour, slotMinute, 0, 0)

        if (slotDateTime >= turnoStart && slotDateTime < turnoEnd) {
          console.log("[v0] Slot occupied:", slot.time, "by turno", turno.id)
          slots[index] = {
            ...slot,
            available:
              turno.estado === "cancelado" ||
              turno.estado === "reprogramado" ||
              turno.estado === "cancelado_paciente" ||
              turno.estado === "cancelado_consultorio",
            turno: turno,
            isFirstSlot: isFirstSlotForThisTurno,
            isContinuation: !isFirstSlotForThisTurno,
          }
          isFirstSlotForThisTurno = false
        }
      })
    })

    setDailySlots(slots)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "confirmado":
        return "bg-green-100 text-green-800"
      case "reservado":
        return "bg-blue-100 text-blue-800"
      case "reprogramado":
        return "bg-yellow-100 text-yellow-800"
      case "cancelado":
      case "cancelado_paciente":
      case "cancelado_consultorio":
        return "bg-red-100 text-red-800"
      case "asistio":
        return "bg-emerald-100 text-emerald-800"
      case "no_asistio_con_justificativo":
        return "bg-orange-100 text-orange-800"
      case "no_asistio_sin_justificativo":
        return "bg-red-200 text-red-900"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleNewTurnoAtTime = (time: string) => {
    const dateTime = `${selectedDate}T${time}:00`
    const url = `/admin/turnos/nuevo?fecha=${encodeURIComponent(dateTime)}`
    window.location.href = url
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Turnos</h1>
          <p className="text-gray-600">Gestión de turnos y citas</p>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")}>
            Lista
          </Button>
          <Button variant={viewMode === "daily" ? "default" : "outline"} onClick={() => setViewMode("daily")}>
            <Calendar className="h-4 w-4 mr-2" />
            Agenda Diaria
          </Button>
          <Link href="/admin/turnos/nuevo">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Turno
            </Button>
          </Link>
        </div>
      </div>

      {viewMode === "daily" && (
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <label htmlFor="date-select" className="text-sm font-medium text-gray-700">
              Seleccionar fecha:
            </label>
            <Input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
      )}

      {viewMode === "list" ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tratamiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {turnos.map((turno) => (
                <tr key={turno.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(turno.fecha_horario_inicio).toLocaleDateString("es-ES")}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(turno.fecha_horario_inicio).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {turno.pacientes?.nombre_apellido || turno.paciente_dni}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {turno.tratamientos?.nombre || `Tratamiento #${turno.tratamiento_id}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(turno.estado)}`}
                    >
                      {turno.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/admin/turnos/${turno.id}/editar`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {turnos.length === 0 && (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay turnos</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza agregando un nuevo turno.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Agenda del{" "}
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {dailySlots.map((slot, index) => (
              <div
                key={index}
                className={`px-6 py-3 flex items-center justify-between ${
                  slot.available
                    ? "bg-green-50 hover:bg-green-100"
                    : slot.turno
                      ? slot.isContinuation
                        ? "bg-red-100 border-l-4 border-red-400" // Different style for continuation slots
                        : "bg-red-50 hover:bg-red-100"
                      : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{slot.time}</span>
                  </div>

                  {slot.turno && slot.isFirstSlot ? (
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-900">
                        {slot.turno.pacientes?.nombre_apellido || slot.turno.paciente_dni}
                      </span>
                      <span className="text-sm text-gray-600">
                        {slot.turno.tratamientos?.nombre || `Tratamiento #${slot.turno.tratamiento_id}`}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(slot.turno.estado)}`}
                      >
                        {slot.turno.estado}
                      </span>
                      <span className="text-xs text-gray-500">
                        hasta{" "}
                        {new Date(slot.turno.fecha_horario_fin).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ) : slot.turno && slot.isContinuation ? (
                    <span className="text-sm text-gray-500 italic">— continuación —</span>
                  ) : !slot.turno ? (
                    <span className="text-sm text-green-600 font-medium">Disponible</span>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  {slot.turno && slot.isFirstSlot && (
                    <Link href={`/admin/turnos/${slot.turno.id}/editar`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  {slot.available && (
                    <Button
                      size="sm"
                      onClick={() => handleNewTurnoAtTime(slot.time)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agendar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
