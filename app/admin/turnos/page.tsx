"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Edit,
  Calendar,
  Clock,
  RotateCcw,
  X,
  Check,
  MessageCircle,
  User,
  CheckCircle,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AppointmentStatusFlow, AppointmentStatusHistory } from "@/components/appointment-status-flow"

interface Turno {
  id: number
  paciente_dni: string
  tratamiento_id: number
  fecha_horario_inicio: string
  fecha_horario_fin: string
  estado: string
  estado_pago?: string
  calendar_id: string
  status_flow?: {
    current: string
    history: Array<{
      status: string
      changed_at: string
      notes?: string
    }>
  }
  pacientes?: {
    nombre_apellido: string
  }
  tratamientos?: {
    nombre: string
  }
}

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "daily">("list")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [dailySlots, setDailySlots] = useState<TimeSlot[]>([])

  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null)
  const [reprogramarModal, setReprogramarModal] = useState(false)
  const [cancelarModal, setCancelarModal] = useState(false)
  const [confirmarModal, setConfirmarModal] = useState(false)
  const [completarModal, setCompletarModal] = useState(false)
  const [pagoModal, setPagoModal] = useState(false)
  const [historialModal, setHistorialModal] = useState(false)

  const [nuevaFecha, setNuevaFecha] = useState("")
  const [nuevaHora, setNuevaHora] = useState("")
  const [motivoCancelacion, setMotivoCancelacion] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [estadoPago, setEstadoPago] = useState("")

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

      const turnosWithHistory = (data || []).map((turno) => ({
        ...turno,
        status_flow: {
          current: turno.estado,
          history: [], // Empty history until schema is updated
        },
      }))

      setTurnos(turnosWithHistory)
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

  const getPagoColor = (estado: string) => {
    switch (estado) {
      case "pagado":
        return "bg-green-100 text-green-800"
      case "pendiente":
        return "bg-yellow-100 text-yellow-800"
      case "exento":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleNewTurnoAtTime = (time: string) => {
    const dateTime = `${selectedDate}T${time}:00`
    const url = `/admin/turnos/nuevo?fecha=${encodeURIComponent(dateTime)}`
    window.location.href = url
  }

  const handleReprogramarTurno = () => {
    if (!selectedTurno) {
      alert("Por favor seleccione un turno de la tabla")
      return
    }
    setReprogramarModal(true)
  }

  const handleCancelarTurno = () => {
    if (!selectedTurno) {
      alert("Por favor seleccione un turno de la tabla")
      return
    }
    setCancelarModal(true)
  }

  const handleConfirmarTurno = () => {
    if (!selectedTurno) {
      alert("Por favor seleccione un turno de la tabla")
      return
    }
    setConfirmarModal(true)
  }

  const handleMarcarCompletado = () => {
    if (!selectedTurno) {
      alert("Por favor seleccione un turno de la tabla")
      return
    }
    setCompletarModal(true)
  }

  const handleEnviarRecordatorio = () => {
    if (!selectedTurno) {
      alert("Por favor seleccione un turno de la tabla")
      return
    }
    const mensaje = `Hola ${selectedTurno.pacientes?.nombre_apellido}, le recordamos su cita para ${new Date(selectedTurno.fecha_horario_inicio).toLocaleDateString("es-ES")} a las ${new Date(selectedTurno.fecha_horario_inicio).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleVerHistorial = () => {
    if (!selectedTurno) {
      alert("Por favor seleccione un turno de la tabla")
      return
    }
    setHistorialModal(true)
  }

  const handleGestionarPago = () => {
    if (!selectedTurno) {
      alert("Por favor seleccione un turno de la tabla")
      return
    }
    setEstadoPago(selectedTurno.estado_pago || "pendiente")
    setPagoModal(true)
  }

  const updateAppointmentStatus = async (turnoId: number, newStatus: string, notes?: string) => {
    try {
      const { error: updateError } = await supabase
        .from("turnos")
        .update({
          estado: newStatus,
        })
        .eq("id", turnoId)

      if (updateError) throw updateError

      console.log("[v0] Successfully updated appointment status to:", newStatus)
      fetchTurnos()
    } catch (error) {
      console.error("Error updating appointment status:", error)
      throw error
    }
  }

  const confirmarReprogramacion = async () => {
    if (!selectedTurno || !nuevaFecha || !nuevaHora) return

    try {
      const nuevaFechaHora = `${nuevaFecha}T${nuevaHora}:00`
      const { error } = await supabase
        .from("turnos")
        .update({
          fecha_horario_inicio: nuevaFechaHora,
        })
        .eq("id", selectedTurno.id)

      if (error) throw error

      await updateAppointmentStatus(selectedTurno.id, "reprogramado", `Reprogramado para ${nuevaFecha} ${nuevaHora}`)

      setReprogramarModal(false)
      setNuevaFecha("")
      setNuevaHora("")
      alert("Turno reprogramado exitosamente")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al reprogramar el turno")
    }
  }

  const confirmarCancelacion = async () => {
    if (!selectedTurno) return

    try {
      await updateAppointmentStatus(selectedTurno.id, "cancelado", motivoCancelacion)

      setCancelarModal(false)
      setMotivoCancelacion("")
      alert("Turno cancelado exitosamente")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cancelar el turno")
    }
  }

  const confirmarTurno = async () => {
    if (!selectedTurno) return

    try {
      await updateAppointmentStatus(selectedTurno.id, "confirmado", "Turno confirmado por el consultorio")

      setConfirmarModal(false)
      alert("Turno confirmado exitosamente")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al confirmar el turno")
    }
  }

  const completarTurno = async () => {
    if (!selectedTurno) return

    try {
      const { error } = await supabase
        .from("turnos")
        .update({
          estado_pago: "pendiente",
          observaciones: observaciones,
        })
        .eq("id", selectedTurno.id)

      if (error) throw error

      await updateAppointmentStatus(selectedTurno.id, "completado", observaciones)

      setCompletarModal(false)
      setObservaciones("")
      alert("Turno marcado como completado")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al completar el turno")
    }
  }

  const actualizarPago = async () => {
    if (!selectedTurno) return

    try {
      const { error } = await supabase.from("turnos").update({ estado_pago: estadoPago }).eq("id", selectedTurno.id)

      if (error) throw error

      setPagoModal(false)
      fetchTurnos()
      alert("Estado de pago actualizado")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al actualizar el pago")
    }
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

      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gestión de Turnos</h3>
        <div className="flex flex-wrap gap-3">
          {/* Primary Actions */}
          <Button onClick={handleReprogramarTurno} className="bg-yellow-600 hover:bg-yellow-700 text-white">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reprogramar Turno
          </Button>

          <Button onClick={handleCancelarTurno} className="bg-red-600 hover:bg-red-700 text-white">
            <X className="h-4 w-4 mr-2" />
            Cancelar Turno
          </Button>

          <Button onClick={handleConfirmarTurno} className="bg-green-600 hover:bg-green-700 text-white">
            <Check className="h-4 w-4 mr-2" />
            Confirmar Turno
          </Button>

          <Button onClick={handleMarcarCompletado} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar Completado
          </Button>

          <Button onClick={handleGestionarPago} className="bg-purple-600 hover:bg-purple-700 text-white">
            <DollarSign className="h-4 w-4 mr-2" />
            Gestionar Pago (PLUS)
          </Button>

          {/* Secondary Actions */}
          <Button
            onClick={handleEnviarRecordatorio}
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50 bg-transparent"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Enviar Recordatorio WhatsApp
          </Button>

          <Button
            onClick={handleVerHistorial}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50 bg-transparent"
          >
            <User className="h-4 w-4 mr-2" />
            Ver Historial Paciente
          </Button>
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
                  Progreso del Turno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pago (PLUS)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {turnos.map((turno) => (
                <tr
                  key={turno.id}
                  className={`hover:bg-gray-50 cursor-pointer ${selectedTurno?.id === turno.id ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                  onClick={() => setSelectedTurno(turno)}
                >
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
                    <AppointmentStatusFlow
                      currentStatus={turno.estado}
                      history={turno.status_flow?.history}
                      className="max-w-md"
                    />
                    <AppointmentStatusHistory history={turno.status_flow?.history || []} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(turno.estado)}`}
                    >
                      {turno.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {turno.estado === "completado" && (
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPagoColor(turno.estado_pago || "pendiente")}`}
                      >
                        {turno.estado_pago || "pendiente"}
                      </span>
                    )}
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

      {/* Reprogramar Modal */}
      <Dialog open={reprogramarModal} onOpenChange={setReprogramarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprogramar Turno</DialogTitle>
            <DialogDescription>
              Seleccione la nueva fecha y hora para el turno de {selectedTurno?.pacientes?.nombre_apellido}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nueva-fecha" className="text-right">
                Nueva Fecha
              </Label>
              <Input
                id="nueva-fecha"
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nueva-hora" className="text-right">
                Nueva Hora
              </Label>
              <Input
                id="nueva-hora"
                type="time"
                value={nuevaHora}
                onChange={(e) => setNuevaHora(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReprogramarModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarReprogramacion}>Reprogramar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancelar Modal */}
      <Dialog open={cancelarModal} onOpenChange={setCancelarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Turno</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea cancelar el turno de {selectedTurno?.pacientes?.nombre_apellido}?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="motivo" className="text-right">
                Motivo
              </Label>
              <Textarea
                id="motivo"
                placeholder="Ingrese el motivo de la cancelación"
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelarModal(false)}>
              No Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarCancelacion}>
              Sí, Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar Modal */}
      <Dialog open={confirmarModal} onOpenChange={setConfirmarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Turno</DialogTitle>
            <DialogDescription>
              ¿Confirmar el turno de {selectedTurno?.pacientes?.nombre_apellido} para el{" "}
              {selectedTurno && new Date(selectedTurno.fecha_horario_inicio).toLocaleDateString("es-ES")}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarTurno}>Confirmar Turno</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completar Modal */}
      <Dialog open={completarModal} onOpenChange={setCompletarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Completado</DialogTitle>
            <DialogDescription>
              Marcar el turno de {selectedTurno?.pacientes?.nombre_apellido} como completado
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="observaciones" className="text-right">
                Observaciones
              </Label>
              <Textarea
                id="observaciones"
                placeholder="Observaciones del tratamiento realizado"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletarModal(false)}>
              Cancelar
            </Button>
            <Button onClick={completarTurno}>Marcar Completado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pago Modal */}
      <Dialog open={pagoModal} onOpenChange={setPagoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestionar Pago (PLUS)</DialogTitle>
            <DialogDescription>
              Actualizar estado de pago para el turno de {selectedTurno?.pacientes?.nombre_apellido}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="estado-pago" className="text-right">
                Estado de Pago
              </Label>
              <Select value={estadoPago} onValueChange={setEstadoPago}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="exento">Exento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagoModal(false)}>
              Cancelar
            </Button>
            <Button onClick={actualizarPago}>Actualizar Pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Historial Modal */}
      <Dialog open={historialModal} onOpenChange={setHistorialModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historial del Paciente</DialogTitle>
            <DialogDescription>Historial médico de {selectedTurno?.pacientes?.nombre_apellido}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Esta funcionalidad mostrará el historial completo del paciente, incluyendo tratamientos anteriores,
              observaciones médicas, y archivos adjuntos.
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Información del Paciente:</p>
              <p className="text-sm">DNI: {selectedTurno?.paciente_dni}</p>
              <p className="text-sm">Nombre: {selectedTurno?.pacientes?.nombre_apellido}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setHistorialModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface TimeSlot {
  time: string
  available: boolean
  turno?: Turno
  isFirstSlot?: boolean
  isContinuation?: boolean
}
