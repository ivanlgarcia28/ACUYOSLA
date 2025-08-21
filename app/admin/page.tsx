"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, Stethoscope, Eye, Plus, Check, X, MessageCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface DashboardStats {
  totalPacientes: number
  turnosHoy: number
  totalTratamientos: number
  totalProductos: number
}

interface Turno {
  id: number
  fecha_horario_inicio: string
  fecha_horario_fin: string
  estado: string
  observaciones?: string
  pacientes: {
    nombre_apellido: string
    telefono: string // Assuming telefono is available in pacientes
  }
  tratamientos: {
    id: number
    nombre: string
  }
}

interface TurnoTodo {
  id: number
  turno_id: number
  descripcion: string
  completado: boolean
  comentarios?: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPacientes: 0,
    turnosHoy: 0,
    totalTratamientos: 0,
    totalProductos: 0,
  })
  const [turnosSemanaActual, setTurnosSemanaActual] = useState<Turno[]>([])
  const [turnosProximaSemana, setTurnosProximaSemana] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [turnoTodos, setTurnoTodos] = useState<{ [key: number]: TurnoTodo[] }>({})
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null)
  const [newTodoText, setNewTodoText] = useState("")
  const [expandedComments, setExpandedComments] = useState<{ [key: number]: boolean }>({})
  const [turnoObservaciones, setTurnoObservaciones] = useState("")
  const [appointmentFilter, setAppointmentFilter] = useState("semana-actual")
  const [filteredTurnos, setFilteredTurnos] = useState<Turno[]>([])

  const supabase = createClient()

  const getWeekDates = (weekOffset = 0) => {
    const now = new Date()
    const currentDay = now.getDay()
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1) // Monday
    const monday = new Date(now.setDate(diff + weekOffset * 7))
    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)

    return {
      start: monday.toISOString().split("T")[0],
      end: friday.toISOString().split("T")[0] + "T23:59:59",
    }
  }

  const getFilterDates = (filter: string) => {
    const now = new Date()
    const today = now.toISOString().split("T")[0]
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    switch (filter) {
      case "hoy":
        return { start: today, end: today + "T23:59:59" }
      case "manana":
        return { start: tomorrow, end: tomorrow + "T23:59:59" }
      case "semana-actual":
        return getWeekDates(0)
      case "proxima-semana":
        return getWeekDates(1)
      default:
        return getWeekDates(0)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const [pacientesRes, turnosHoyRes, tratamientosRes, productosRes] = await Promise.all([
        supabase.from("pacientes").select("id", { count: "exact" }),
        supabase
          .from("turnos")
          .select("id", { count: "exact" })
          .gte("fecha_horario_inicio", new Date().toISOString().split("T")[0])
          .lt("fecha_horario_inicio", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
        supabase.from("tratamientos").select("id", { count: "exact" }),
        supabase.from("productos").select("id", { count: "exact" }),
      ])

      setStats({
        totalPacientes: pacientesRes.count || 0,
        turnosHoy: turnosHoyRes.count || 0,
        totalTratamientos: tratamientosRes.count || 0,
        totalProductos: productosRes.count || 0,
      })

      const currentWeek = getWeekDates(0)
      const { data: turnosActuales } = await supabase
        .from("turnos")
        .select(`
          id,
          fecha_horario_inicio,
          fecha_horario_fin,
          estado,
          observaciones,
          pacientes!inner(nombre_apellido, telefono),
          tratamientos!inner(id, nombre)
        `)
        .gte("fecha_horario_inicio", currentWeek.start)
        .lte("fecha_horario_inicio", currentWeek.end)
        .order("fecha_horario_inicio")

      const nextWeek = getWeekDates(1)
      const { data: turnosProximos } = await supabase
        .from("turnos")
        .select(`
          id,
          fecha_horario_inicio,
          fecha_horario_fin,
          estado,
          observaciones,
          pacientes!inner(nombre_apellido, telefono),
          tratamientos!inner(id, nombre)
        `)
        .gte("fecha_horario_inicio", nextWeek.start)
        .lte("fecha_horario_inicio", nextWeek.end)
        .order("fecha_horario_inicio")

      setTurnosSemanaActual(turnosActuales || [])
      setTurnosProximaSemana(turnosProximos || [])

      fetchFilteredTurnos(appointmentFilter)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFilteredTurnos = async (filter: string) => {
    const dateRange = getFilterDates(filter)

    const { data: turnos } = await supabase
      .from("turnos")
      .select(`
        id,
        fecha_horario_inicio,
        fecha_horario_fin,
        estado,
        observaciones,
        pacientes!inner(nombre_apellido, telefono),
        tratamientos!inner(id, nombre)
      `)
      .gte("fecha_horario_inicio", dateRange.start)
      .lte("fecha_horario_inicio", dateRange.end)
      .order("fecha_horario_inicio")

    setFilteredTurnos(turnos || [])
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (!loading) {
      fetchFilteredTurnos(appointmentFilter)
    }
  }, [appointmentFilter])

  const getRowBackgroundColor = (estado: string) => {
    const colors = {
      cancelado: "bg-red-50 hover:bg-red-100",
      confirmado: "bg-green-50 hover:bg-green-100",
      reservado: "bg-yellow-50 hover:bg-yellow-100",
      reprogramado: "bg-orange-50 hover:bg-orange-100",
    }
    return colors[estado as keyof typeof colors] || "hover:bg-gray-50"
  }

  const getEstadoBadge = (estado: string) => {
    const variants = {
      reservado: "bg-yellow-500 text-white font-semibold",
      confirmado: "bg-green-500 text-white font-semibold",
      reprogramado: "bg-orange-500 text-white font-semibold",
      cancelado: "bg-red-500 text-white font-semibold",
    }
    return variants[estado as keyof typeof variants] || "bg-gray-500 text-white font-semibold"
  }

  const fetchTurnoTodos = async (turnoId: number) => {
    const { data: existingTodos } = await supabase.from("turno_todos").select("*").eq("turno_id", turnoId).order("id")

    if (!existingTodos || existingTodos.length === 0) {
      const turno = [...turnosSemanaActual, ...turnosProximaSemana].find((t) => t.id === turnoId)
      if (turno) {
        const { data: templateTasks } = await supabase
          .from("tratamiento_tareas_template")
          .select("*")
          .eq("tratamiento_id", turno.tratamientos.id)

        if (templateTasks && templateTasks.length > 0) {
          const tasksToInsert = templateTasks.map((template) => ({
            turno_id: turnoId,
            descripcion: template.descripcion,
            completado: false,
            comentarios: "",
          }))

          await supabase.from("turno_todos").insert(tasksToInsert)

          const { data: newTodos } = await supabase.from("turno_todos").select("*").eq("turno_id", turnoId).order("id")

          setTurnoTodos((prev) => ({ ...prev, [turnoId]: newTodos || [] }))
          return
        }
      }
    }

    setTurnoTodos((prev) => ({ ...prev, [turnoId]: existingTodos || [] }))
  }

  const toggleTodo = async (todoId: number, turnoId: number, newStatus: boolean) => {
    await supabase.from("turno_todos").update({ completado: newStatus }).eq("id", todoId)
    fetchTurnoTodos(turnoId)
  }

  const updateTodoComment = async (todoId: number, turnoId: number, comentarios: string) => {
    await supabase.from("turno_todos").update({ comentarios }).eq("id", todoId)
    fetchTurnoTodos(turnoId)
  }

  const updateTurnoObservaciones = async (turnoId: number, observaciones: string) => {
    await supabase.from("turnos").update({ observaciones }).eq("id", turnoId)

    setTurnosSemanaActual((prev) => prev.map((t) => (t.id === turnoId ? { ...t, observaciones } : t)))
    setTurnosProximaSemana((prev) => prev.map((t) => (t.id === turnoId ? { ...t, observaciones } : t)))
  }

  const addTodo = async (turnoId: number) => {
    if (!newTodoText.trim()) return

    await supabase.from("turno_todos").insert({
      turno_id: turnoId,
      descripcion: newTodoText,
      completado: false,
    })

    setNewTodoText("")
    fetchTurnoTodos(turnoId)
  }

  const openTurnoDetail = (turno: Turno) => {
    setSelectedTurno(turno)
    setTurnoObservaciones(turno.observaciones || "")
    fetchTurnoTodos(turno.id)
  }

  const getFilterTitle = (filter: string) => {
    const titles = {
      hoy: "Turnos de Hoy",
      manana: "Turnos de Mañana",
      "semana-actual": "Turnos de la Semana Actual",
      "proxima-semana": "Turnos de la Próxima Semana",
    }
    return titles[filter as keyof typeof titles] || "Turnos"
  }

  const generateWhatsAppMessage = (turno: Turno) => {
    const fecha = new Date(turno.fecha_horario_inicio).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const hora = new Date(turno.fecha_horario_inicio).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })

    const mensaje = `Hola ${turno.pacientes.nombre_apellido}! 👋

Le recordamos su turno programado para mañana:

📅 Fecha: ${fecha}
🕐 Hora: ${hora}
🦷 Tratamiento: ${turno.tratamientos.nombre}

Por favor, confirme su asistencia respondiendo:
✅ "CONFIRMO" si puede asistir
❌ "CANCELO" si necesita reprogramar

¡Gracias!
Ele Odontología`

    return encodeURIComponent(mensaje)
  }

  const getWhatsAppLink = (turno: Turno, telefono: string) => {
    const mensaje = generateWhatsAppMessage(turno)
    return `https://wa.me/${telefono}?text=${mensaje}`
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="text-gray-600">Consultorio Dental - Sistema de Gestión</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalPacientes}</div>
            <p className="text-xs text-muted-foreground">Total registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.turnosHoy}</div>
            <p className="text-xs text-muted-foreground">Programados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tratamientos</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalTratamientos}</div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalProductos}</div>
            <p className="text-xs text-muted-foreground">En stock</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {getFilterTitle(appointmentFilter)}
            </CardTitle>
            <Select value={appointmentFilter} onValueChange={setAppointmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar turnos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoy">Turnos de Hoy</SelectItem>
                <SelectItem value="manana">Turnos de Mañana</SelectItem>
                <SelectItem value="semana-actual">Semana Actual</SelectItem>
                <SelectItem value="proxima-semana">Próxima Semana</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTurnos.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay turnos programados para el período seleccionado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Fecha</th>
                    <th className="text-left py-2">Hora</th>
                    <th className="text-left py-2">Paciente</th>
                    <th className="text-left py-2">Tratamiento</th>
                    <th className="text-left py-2">Estado</th>
                    <th className="text-left py-2">Acciones</th>
                    {appointmentFilter === "manana" && <th className="text-left py-2">Confirmar</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredTurnos.map((turno) => (
                    <tr key={turno.id} className={`border-b ${getRowBackgroundColor(turno.estado)}`}>
                      <td className="py-2">{new Date(turno.fecha_horario_inicio).toLocaleDateString("es-ES")}</td>
                      <td className="py-2">
                        {new Date(turno.fecha_horario_inicio).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2">{turno.pacientes.nombre_apellido}</td>
                      <td className="py-2">{turno.tratamientos.nombre}</td>
                      <td className="py-2">
                        <Badge className={getEstadoBadge(turno.estado)}>{turno.estado.toUpperCase()}</Badge>
                      </td>
                      <td className="py-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => openTurnoDetail(turno)}>
                              <Eye className="h-4 w-4 mr-1" />
                              Detalle
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            {selectedTurno && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p>
                                      <strong>Paciente:</strong> {selectedTurno.pacientes.nombre_apellido}
                                    </p>
                                    <p>
                                      <strong>Tratamiento:</strong> {selectedTurno.tratamientos.nombre}
                                    </p>
                                  </div>
                                  <div>
                                    <p>
                                      <strong>Fecha:</strong>{" "}
                                      {new Date(selectedTurno.fecha_horario_inicio).toLocaleDateString("es-ES")}
                                    </p>
                                    <p>
                                      <strong>Hora:</strong>{" "}
                                      {new Date(selectedTurno.fecha_horario_inicio).toLocaleTimeString("es-ES", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-3">Lista de Preparación</h4>
                                  <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {turnoTodos[selectedTurno.id]?.map((todo) => (
                                      <div key={todo.id} className="border rounded-lg p-3 bg-gray-50">
                                        <div className="flex items-center justify-between mb-2">
                                          <span
                                            className={`flex-1 ${todo.completado ? "line-through text-gray-500" : ""}`}
                                          >
                                            {todo.descripcion}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <Button
                                              size="sm"
                                              variant={todo.completado ? "default" : "outline"}
                                              className={todo.completado ? "bg-green-500 hover:bg-green-600" : ""}
                                              onClick={() => toggleTodo(todo.id, selectedTurno.id, true)}
                                            >
                                              <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant={!todo.completado ? "default" : "outline"}
                                              className={!todo.completado ? "bg-red-500 hover:bg-red-600" : ""}
                                              onClick={() => toggleTodo(todo.id, selectedTurno.id, false)}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() =>
                                                setExpandedComments((prev) => ({ ...prev, [todo.id]: !prev[todo.id] }))
                                              }
                                            >
                                              <MessageCircle className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                        {expandedComments[todo.id] && (
                                          <Textarea
                                            placeholder="Agregar comentarios..."
                                            value={todo.comentarios || ""}
                                            onChange={(e) =>
                                              updateTodoComment(todo.id, selectedTurno.id, e.target.value)
                                            }
                                            className="mt-2"
                                            rows={2}
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex gap-2 mt-4">
                                    <input
                                      type="text"
                                      placeholder="Agregar nueva tarea..."
                                      value={newTodoText}
                                      onChange={(e) => setNewTodoText(e.target.value)}
                                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                                      onKeyPress={(e) => e.key === "Enter" && addTodo(selectedTurno.id)}
                                    />
                                    <Button onClick={() => addTodo(selectedTurno.id)}>
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-2">Observaciones del Turno</h4>
                                  <Textarea
                                    placeholder="Agregar observaciones generales..."
                                    value={turnoObservaciones}
                                    onChange={(e) => setTurnoObservaciones(e.target.value)}
                                    onBlur={() => updateTurnoObservaciones(selectedTurno.id, turnoObservaciones)}
                                    rows={3}
                                  />
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </td>
                      {appointmentFilter === "manana" && (
                        <td className="py-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            onClick={() => {
                              const telefono = turno.pacientes.telefono || "5493875350657" // Default clinic number for demo
                              window.open(getWhatsAppLink(turno, telefono), "_blank")
                            }}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            WhatsApp
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
