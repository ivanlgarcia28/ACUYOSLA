"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NotificationModal, useNotification } from "@/components/ui/notification-modal"
import { Calendar, Clock, User, FileText, CheckCircle, XCircle, RotateCcw, AlertCircle, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Turno {
  id: number
  fecha_horario_inicio: string
  fecha_horario_fin: string
  estado: string
  tratamientos: {
    nombre: string
    descripcion: string
  }
  observaciones?: string
  created_at?: string
}

interface TimeSlot {
  value: string
  label: string
}

export default function PacienteDashboard() {
  const [paciente, setPaciente] = useState<any>(null)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Estados para modales
  const [cancelDialog, setCancelDialog] = useState(false)
  const [rescheduleDialog, setRescheduleDialog] = useState(false)
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("")
  const [rescheduleReason, setRescheduleReason] = useState("")

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const { notification, showNotification, hideNotification } = useNotification()

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
          observaciones,
          created_at,
          tratamientos (
            nombre,
            descripcion
          )
        `)
        .eq("paciente_dni", dni)
        .neq("estado", "reprogramado_paciente")
        .order("fecha_horario_inicio", { ascending: false })

      if (error) throw error
      setTurnos(data || [])
    } catch (error) {
      console.error("Error fetching turnos:", error)
      showNotification("Error al cargar los turnos", "error")
    } finally {
      setLoading(false)
    }
  }

  const getNextAppointment = () => {
    const now = new Date()
    return turnos
      .filter(
        (t) =>
          new Date(t.fecha_horario_inicio) > now &&
          (t.estado === "confirmado" || t.estado === "reservado" || t.estado === "confirmado_paciente"),
      )
      .sort((a, b) => new Date(a.fecha_horario_inicio).getTime() - new Date(b.fecha_horario_inicio).getTime())[0]
  }

  const canManageAppointment = (fechaInicio: string, estado: string) => {
    if (estado === "confirmado_paciente" || estado === "cancelado_paciente" || estado === "reprogramado_paciente") {
      return false
    }

    const appointmentDate = new Date(fechaInicio)
    const now = new Date()
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    return appointmentDate > now && appointmentDate <= twentyFourHoursFromNow
  }

  const isWithin24Hours = (fechaInicio: string) => {
    const appointmentDate = new Date(fechaInicio)
    const now = new Date()
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    return appointmentDate > now && appointmentDate <= twentyFourHoursFromNow
  }

  const handleConfirmAppointment = async (turno: Turno) => {
    setActionLoading(true)
    try {
      const response = await fetch("/api/turnos/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnoId: turno.id,
          pacienteDni: paciente.dni,
        }),
      })

      if (response.ok) {
        await fetchTurnos(paciente.dni)
        showNotification("Turno confirmado exitosamente", "success")
      } else {
        showNotification("Error al confirmar el turno", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("Error al confirmar el turno", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelAppointment = async () => {
    if (!selectedTurno) return

    setActionLoading(true)
    try {
      const response = await fetch("/api/turnos/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnoId: selectedTurno.id,
          pacienteDni: paciente.dni,
          motivo: cancelReason,
        }),
      })

      if (response.ok) {
        await fetchTurnos(paciente.dni)
        setCancelDialog(false)
        setCancelReason("")
        setSelectedTurno(null)
        showNotification("Turno cancelado exitosamente", "success")
      } else {
        showNotification("Error al cancelar el turno", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("Error al cancelar el turno", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleRescheduleAppointment = async () => {
    if (!selectedTurno || !rescheduleDate || !rescheduleTime) return

    setActionLoading(true)
    try {
      const response = await fetch("/api/turnos/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnoId: selectedTurno.id,
          pacienteDni: paciente.dni,
          nuevaFecha: rescheduleDate,
          nuevaHora: rescheduleTime,
          motivo: rescheduleReason,
        }),
      })

      if (response.ok) {
        await fetchTurnos(paciente.dni)
        setRescheduleDialog(false)
        setRescheduleDate("")
        setRescheduleTime("")
        setRescheduleReason("")
        setSelectedTurno(null)
        setAvailableSlots([])
        showNotification("Turno reprogramado exitosamente", "success")
      } else {
        showNotification("Error al reprogramar el turno", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("Error al reprogramar el turno", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusMessage = (estado: string) => {
    switch (estado) {
      case "confirmado_paciente":
        return {
          type: "success",
          message: "Te esperamos en Caseros 842, cualquier duda, escribinos por WhatsApp al +54 9 387 535-0665",
        }
      case "cancelado_paciente":
        return {
          type: "error",
          message: "Lamentamos que no puedas asistir a tu turno",
        }
      case "reprogramado_paciente":
        return {
          type: "info",
          message: "Tu turno ha sido reprogramado. Pronto recibirás la confirmación de la nueva fecha.",
        }
      default:
        return null
    }
  }

  const getEstadoBadge = (estado: string) => {
    const colors = {
      confirmado: "bg-blue-100 text-blue-800",
      confirmado_paciente: "bg-green-100 text-green-800",
      confirmado_consultorio: "bg-emerald-100 text-emerald-800",
      reservado: "bg-yellow-100 text-yellow-800",
      completado: "bg-green-100 text-green-800",
      asistio: "bg-green-100 text-green-800",
      no_asistio_con_justificativo: "bg-yellow-100 text-yellow-800",
      no_asistio_sin_justificativo: "bg-red-100 text-red-800",
      cancelado_paciente: "bg-gray-100 text-gray-800",
      cancelado_consultorio: "bg-gray-100 text-gray-800",
      reprogramado: "bg-purple-100 text-purple-800",
      reprogramado_paciente: "bg-purple-100 text-purple-800",
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

  const fetchAvailableSlots = async (fecha: string) => {
    if (!fecha) return

    setLoadingSlots(true)
    try {
      const response = await fetch(`/api/turnos/available-slots?fecha=${fecha}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.availableSlots || [])
      } else {
        console.error("Error fetching available slots")
        setAvailableSlots([])
      }
    } catch (error) {
      console.error("Error fetching available slots:", error)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  useEffect(() => {
    if (rescheduleDate) {
      fetchAvailableSlots(rescheduleDate)
    }
  }, [rescheduleDate])

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

  const nextAppointment = getNextAppointment()

  return (
    <div className="p-6 space-y-6">
      <NotificationModal
        isOpen={!!notification}
        onClose={hideNotification}
        title={notification?.type === "success" ? "Éxito" : notification?.type === "error" ? "Error" : "Información"}
        message={notification?.message || ""}
        type={notification?.type || "info"}
      />

      <div className="flex items-center space-x-3">
        <User className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {paciente?.nombre_apellido}</h1>
          <p className="text-gray-600">DNI: {paciente?.dni}</p>
        </div>
      </div>

      {nextAppointment && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span>Próximo Turno</span>
              {isWithin24Hours(nextAppointment.fecha_horario_inicio) && (
                <Badge className="bg-orange-100 text-orange-800 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Gestión disponible
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{formatDate(nextAppointment.fecha_horario_inicio)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>
                    {formatTime(nextAppointment.fecha_horario_inicio)} - {formatTime(nextAppointment.fecha_horario_fin)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {nextAppointment.tratamientos?.nombre || "Tratamiento no especificado"}
                  </p>
                  <Badge className={getEstadoBadge(nextAppointment.estado)}>
                    {nextAppointment.estado.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>

              {canManageAppointment(nextAppointment.fecha_horario_inicio, nextAppointment.estado) ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">Gestiona tu turno:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleConfirmAppointment(nextAppointment)}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirmar Asistencia
                    </Button>

                    <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setSelectedTurno(nextAppointment)}
                          disabled={actionLoading}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancelar Turno
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cancelar Turno</DialogTitle>
                          <DialogDescription>
                            ¿Estás seguro que deseas cancelar tu turno? Esta acción no se puede deshacer.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="cancel-reason">Motivo de cancelación (opcional)</Label>
                            <Textarea
                              id="cancel-reason"
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              placeholder="Explica brevemente el motivo..."
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCancelDialog(false)}>
                            Volver
                          </Button>
                          <Button variant="destructive" onClick={handleCancelAppointment} disabled={actionLoading}>
                            Cancelar Turno
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={rescheduleDialog} onOpenChange={setRescheduleDialog}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTurno(nextAppointment)}
                          disabled={actionLoading}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reprogramar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reprogramar Turno</DialogTitle>
                          <DialogDescription>Selecciona una nueva fecha y hora para tu turno.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="reschedule-date">Nueva Fecha</Label>
                              <Input
                                id="reschedule-date"
                                type="date"
                                value={rescheduleDate}
                                onChange={(e) => setRescheduleDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                              />
                            </div>
                            <div>
                              <Label htmlFor="reschedule-time">Nueva Hora</Label>
                              <Select
                                value={rescheduleTime}
                                onValueChange={setRescheduleTime}
                                disabled={!rescheduleDate || loadingSlots}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      loadingSlots
                                        ? "Cargando horarios..."
                                        : !rescheduleDate
                                          ? "Selecciona una fecha primero"
                                          : availableSlots.length === 0
                                            ? "No hay horarios disponibles"
                                            : "Selecciona un horario"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableSlots.map((slot) => (
                                    <SelectItem key={slot.value} value={slot.value}>
                                      {slot.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="reschedule-reason">Motivo (opcional)</Label>
                            <Textarea
                              id="reschedule-reason"
                              value={rescheduleReason}
                              onChange={(e) => setRescheduleReason(e.target.value)}
                              placeholder="Explica brevemente el motivo..."
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setRescheduleDialog(false)}>
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleRescheduleAppointment}
                            disabled={actionLoading || !rescheduleDate || !rescheduleTime}
                          >
                            Reprogramar Turno
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {!isWithin24Hours(nextAppointment.fecha_horario_inicio) &&
                    nextAppointment.estado !== "confirmado_paciente" &&
                    nextAppointment.estado !== "cancelado_paciente" && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="flex items-center space-x-2">
                          <Lock className="h-4 w-4 text-amber-600" />
                          <p className="text-sm text-amber-800">
                            La gestión de turnos se habilita 24 horas antes de la cita
                          </p>
                        </div>
                      </div>
                    )}

                  {(() => {
                    const statusMessage = getStatusMessage(nextAppointment.estado)
                    if (statusMessage) {
                      return (
                        <div
                          className={`p-4 rounded-lg ${
                            statusMessage.type === "success"
                              ? "bg-green-50 border border-green-200"
                              : statusMessage.type === "error"
                                ? "bg-red-50 border border-red-200"
                                : "bg-blue-50 border border-blue-200"
                          }`}
                        >
                          <p
                            className={`text-sm ${
                              statusMessage.type === "success"
                                ? "text-green-800"
                                : statusMessage.type === "error"
                                  ? "text-red-800"
                                  : "text-blue-800"
                            }`}
                          >
                            {statusMessage.message}
                          </p>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
            {nextAppointment ? (
              <div className="text-sm">{formatDate(nextAppointment.fecha_horario_inicio)}</div>
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
                    <div className="flex flex-col items-end space-y-2">
                      <Badge className={getEstadoBadge(turno.estado)}>{turno.estado.replace(/_/g, " ")}</Badge>
                      {!canManageAppointment(turno.fecha_horario_inicio, turno.estado) &&
                        !isWithin24Hours(turno.fecha_horario_inicio) &&
                        turno.estado !== "confirmado_paciente" &&
                        turno.estado !== "cancelado_paciente" && (
                          <Lock className="h-4 w-4 text-gray-400" title="Gestión disponible 24h antes" />
                        )}
                      {canManageAppointment(turno.fecha_horario_inicio, turno.estado) ? (
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleConfirmAppointment(turno)}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmar
                          </Button>

                          <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setSelectedTurno(turno)}
                                disabled={actionLoading}
                                className="text-xs px-2 py-1"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancelar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Cancelar Turno</DialogTitle>
                                <DialogDescription>
                                  ¿Estás seguro que deseas cancelar tu turno? Esta acción no se puede deshacer.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="cancel-reason">Motivo de cancelación (opcional)</Label>
                                  <Textarea
                                    id="cancel-reason"
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Explica brevemente el motivo..."
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setCancelDialog(false)}>
                                  Volver
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleCancelAppointment}
                                  disabled={actionLoading}
                                >
                                  Cancelar Turno
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog open={rescheduleDialog} onOpenChange={setRescheduleDialog}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedTurno(turno)}
                                disabled={actionLoading}
                                className="text-xs px-2 py-1"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reprogramar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reprogramar Turno</DialogTitle>
                                <DialogDescription>Selecciona una nueva fecha y hora para tu turno.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="reschedule-date">Nueva Fecha</Label>
                                    <Input
                                      id="reschedule-date"
                                      type="date"
                                      value={rescheduleDate}
                                      onChange={(e) => setRescheduleDate(e.target.value)}
                                      min={new Date().toISOString().split("T")[0]}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="reschedule-time">Nueva Hora</Label>
                                    <Select
                                      value={rescheduleTime}
                                      onValueChange={setRescheduleTime}
                                      disabled={!rescheduleDate || loadingSlots}
                                    >
                                      <SelectTrigger>
                                        <SelectValue
                                          placeholder={
                                            loadingSlots
                                              ? "Cargando horarios..."
                                              : !rescheduleDate
                                                ? "Selecciona una fecha primero"
                                                : availableSlots.length === 0
                                                  ? "No hay horarios disponibles"
                                                  : "Selecciona un horario"
                                          }
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableSlots.map((slot) => (
                                          <SelectItem key={slot.value} value={slot.value}>
                                            {slot.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="reschedule-reason">Motivo (opcional)</Label>
                                  <Textarea
                                    id="reschedule-reason"
                                    value={rescheduleReason}
                                    onChange={(e) => setRescheduleReason(e.target.value)}
                                    placeholder="Explica brevemente el motivo..."
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setRescheduleDialog(false)}>
                                  Cancelar
                                </Button>
                                <Button
                                  onClick={handleRescheduleAppointment}
                                  disabled={actionLoading || !rescheduleDate || !rescheduleTime}
                                >
                                  Reprogramar Turno
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ) : (
                        (() => {
                          const statusMessage = getStatusMessage(turno.estado)
                          if (statusMessage) {
                            return (
                              <div
                                className={`p-2 rounded text-xs max-w-xs ${
                                  statusMessage.type === "success"
                                    ? "bg-green-50 border border-green-200 text-green-800"
                                    : statusMessage.type === "error"
                                      ? "bg-red-50 border border-red-200 text-red-800"
                                      : "bg-blue-50 border border-blue-200 text-blue-800"
                                }`}
                              >
                                {statusMessage.message}
                              </div>
                            )
                          }
                          return null
                        })()
                      )}
                    </div>
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
