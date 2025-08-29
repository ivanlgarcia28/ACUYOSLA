"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarView } from "@/components/ui/calendar-view"
import { NotificationModal, useNotification } from "@/components/ui/notification-modal"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Calendar,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  DollarSign,
  MessageSquare,
  History,
  Settings,
  Filter,
  Download,
  Phone,
  WheatIcon as WhatsApp,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react"

interface Turno {
  id: number
  paciente_dni: string
  tratamiento_id: number
  fecha_horario_inicio: string
  fecha_horario_fin: string
  estado: string
  calendar_id: string
  observaciones?: string
  prioridad?: "baja" | "media" | "alta" | "urgente"
  pacientes?: {
    nombre_apellido: string
    telefono?: string
    email?: string
  }
  tratamientos?: {
    nombre: string
  }
  created_at?: string
  confirmacion_solicitada_at?: string
  confirmado_at?: string
}

interface TurnoHistorial {
  id: number
  turno_id: number
  estado_anterior: string
  estado_nuevo: string
  motivo?: string
  usuario_id?: string
  created_at: string
}

interface TurnoPago {
  id: number
  turno_id: number
  monto: number
  metodo_pago: string
  estado_pago: string
  fecha_pago: string
}

interface DashboardStats {
  totalTurnos: number
  turnosHoy: number
  confirmados: number
  pendientes: number
  cancelados: number
  ingresos: number
  tasaConfirmacion: number
  promedioEspera: number
}

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [filteredTurnos, setFilteredTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<"dashboard" | "calendar" | "list" | "analytics">("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("today")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null)
  const [showManageModal, setShowManageModal] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalTurnos: 0,
    turnosHoy: 0,
    confirmados: 0,
    pendientes: 0,
    cancelados: 0,
    ingresos: 0,
    tasaConfirmacion: 0,
    promedioEspera: 0,
  })

  const { notification, showNotification, hideNotification } = useNotification()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchTurnos()
  }, [])

  useEffect(() => {
    filterTurnos()
  }, [turnos, searchTerm, statusFilter, dateFilter, priorityFilter])

  const fetchTurnos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("turnos")
        .select(`
          *,
          pacientes (
            nombre_apellido,
            telefono,
            email
          ),
          tratamientos (
            nombre
          )
        `)
        .neq("estado", "reprogramado_paciente")
        .order("fecha_horario_inicio", { ascending: true })

      if (error) throw error

      setTurnos(data || [])
      await calculateStats(data || [])
    } catch (error) {
      console.error("Error fetching turnos:", error)
      showNotification("Error al cargar los turnos", "error")
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = async (turnosData: Turno[]) => {
    const today = new Date().toISOString().split("T")[0]
    const turnosHoy = turnosData.filter((t) => new Date(t.fecha_horario_inicio).toISOString().split("T")[0] === today)

    // Fetch payment data
    const { data: pagos } = await supabase
      .from("turnos_pagos")
      .select("monto, estado_pago")
      .eq("estado_pago", "completado")

    const ingresosTotales = pagos?.reduce((sum, pago) => sum + pago.monto, 0) || 0
    const confirmados = turnosData.filter(
      (t) => t.estado === "confirmado_clinica" || t.estado === "confirmado_paciente",
    ).length

    const tasaConfirmacion = turnosData.length > 0 ? (confirmados / turnosData.length) * 100 : 0

    setStats({
      totalTurnos: turnosData.length,
      turnosHoy: turnosHoy.length,
      confirmados,
      pendientes: turnosData.filter((t) => t.estado === "reservado").length,
      cancelados: turnosData.filter((t) => t.estado.includes("cancelado")).length,
      ingresos: ingresosTotales,
      tasaConfirmacion,
      promedioEspera: 0, // TODO: Calculate from historial
    })
  }

  const filterTurnos = () => {
    let filtered = [...turnos]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (turno) =>
          turno.pacientes?.nombre_apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          turno.tratamientos?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          turno.paciente_dni.includes(searchTerm) ||
          turno.observaciones?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((turno) => turno.estado === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((turno) => turno.prioridad === priorityFilter)
    }

    // Date filter
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    switch (dateFilter) {
      case "today":
        filtered = filtered.filter(
          (turno) => new Date(turno.fecha_horario_inicio).toISOString().split("T")[0] === todayStr,
        )
        break
      case "week":
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        filtered = filtered.filter((turno) => {
          const turnoDate = new Date(turno.fecha_horario_inicio)
          return turnoDate >= weekStart && turnoDate <= weekEnd
        })
        break
      case "month":
        filtered = filtered.filter((turno) => {
          const turnoDate = new Date(turno.fecha_horario_inicio)
          return turnoDate.getMonth() === today.getMonth() && turnoDate.getFullYear() === today.getFullYear()
        })
        break
    }

    setFilteredTurnos(filtered)
  }

  const updateTurnoStatus = async (turnoId: number, newStatus: string, motivo?: string) => {
    try {
      const { error } = await supabase
        .from("turnos")
        .update({
          estado: newStatus,
          confirmado_at: newStatus.includes("confirmado") ? new Date().toISOString() : null,
        })
        .eq("id", turnoId)

      if (error) throw error

      // Log to historial
      await supabase.from("turnos_historial").insert({
        turno_id: turnoId,
        estado_anterior: selectedTurno?.estado,
        estado_nuevo: newStatus,
        motivo,
        created_at: new Date().toISOString(),
      })

      await fetchTurnos()
      showNotification("Estado actualizado correctamente", "success")
      setShowManageModal(false)
    } catch (error) {
      console.error("Error updating status:", error)
      showNotification("Error al actualizar el estado", "error")
    }
  }

  const getStatusBadge = (estado: string, prioridad?: string) => {
    const statusConfig = {
      reservado: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Reservado" },
      confirmado_paciente: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Confirmado Paciente" },
      confirmado_clinica: { color: "bg-green-100 text-green-800 border-green-200", label: "Confirmado Clínica" },
      en_curso: { color: "bg-purple-100 text-purple-800 border-purple-200", label: "En Curso" },
      completado: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Completado" },
      cancelado_paciente: { color: "bg-red-100 text-red-800 border-red-200", label: "Cancelado Paciente" },
      cancelado_clinica: { color: "bg-red-100 text-red-800 border-red-200", label: "Cancelado Clínica" },
      no_asistio: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "No Asistió" },
    }

    const priorityColors = {
      urgente: "border-l-4 border-l-red-500",
      alta: "border-l-4 border-l-orange-500",
      media: "border-l-4 border-l-yellow-500",
      baja: "border-l-4 border-l-green-500",
    }

    const config = statusConfig[estado as keyof typeof statusConfig] || {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      label: estado,
    }

    return (
      <Badge className={`${config.color} ${prioridad ? priorityColors[prioridad as keyof typeof priorityColors] : ""}`}>
        {config.label}
      </Badge>
    )
  }

  const DashboardView = () => (
    <div className="space-y-6">
      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.turnosHoy}</div>
            <p className="text-xs text-muted-foreground">{stats.confirmados} confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa Confirmación</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.tasaConfirmacion.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.confirmados} de {stats.totalTurnos} turnos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.ingresos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Este período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Centro de Control</CardTitle>
          <CardDescription>Acciones rápidas y herramientas de gestión</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button onClick={() => setActiveView("calendar")} className="bg-blue-600 hover:bg-blue-700">
              <Calendar className="h-4 w-4 mr-2" />
              Calendario
            </Button>
            <Button onClick={() => setActiveView("list")} variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Lista Completa
            </Button>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Turno
            </Button>
            <Button onClick={() => setActiveView("analytics")} variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Confirmaciones
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline">
              <CreditCard className="h-4 w-4 mr-2" />
              Pagos
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Agenda de Hoy</CardTitle>
          <CardDescription>Turnos programados para {new Date().toLocaleDateString("es-AR")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTurnos.slice(0, 8).map((turno) => (
              <div key={turno.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      turno.estado === "confirmado_clinica"
                        ? "bg-green-500"
                        : turno.estado === "confirmado_paciente"
                          ? "bg-blue-500"
                          : turno.estado === "reservado"
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                    }`}
                  ></div>
                  <div>
                    <p className="font-medium">{turno.pacientes?.nombre_apellido || `DNI: ${turno.paciente_dni}`}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(turno.fecha_horario_inicio).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      - {turno.tratamientos?.nombre || "Consulta"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(turno.estado, turno.prioridad)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTurno(turno)
                      setShowManageModal(true)
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredTurnos.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No hay turnos programados para hoy</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const ListView = () => (
    <div className="space-y-4">
      {/* Advanced Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="reservado">Reservado</SelectItem>
                <SelectItem value="confirmado_paciente">Confirmado Paciente</SelectItem>
                <SelectItem value="confirmado_clinica">Confirmado Clínica</SelectItem>
                <SelectItem value="en_curso">En Curso</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="cancelado_paciente">Cancelado Paciente</SelectItem>
                <SelectItem value="no_asistio">No Asistió</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              Más filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Appointments List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Turnos ({filteredTurnos.length})</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Cargando turnos...</p>
              </div>
            ) : filteredTurnos.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron turnos</p>
              </div>
            ) : (
              filteredTurnos.map((turno) => (
                <div key={turno.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">
                          {turno.pacientes?.nombre_apellido || `DNI: ${turno.paciente_dni}`}
                        </h3>
                        {getStatusBadge(turno.estado, turno.prioridad)}
                        {turno.prioridad === "urgente" && (
                          <Badge variant="destructive" className="text-xs">
                            URGENTE
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <p>
                          📅 {new Date(turno.fecha_horario_inicio).toLocaleDateString("es-AR")} -{" "}
                          {new Date(turno.fecha_horario_inicio).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p>🦷 {turno.tratamientos?.nombre || "Consulta"}</p>
                        {turno.pacientes?.telefono && <p>📞 {turno.pacientes.telefono}</p>}
                        {turno.confirmado_at && (
                          <p>✅ Confirmado: {new Date(turno.confirmado_at).toLocaleDateString("es-AR")}</p>
                        )}
                        {turno.observaciones && <p>📝 {turno.observaciones}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTurno(turno)
                          setShowManageModal(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Gestionar
                      </Button>
                      {turno.pacientes?.telefono && (
                        <Button size="sm" variant="outline">
                          <WhatsApp className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const AnalyticsView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analytics y Reportes</CardTitle>
          <CardDescription>Análisis detallado del rendimiento de turnos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4" />
            <p>Vista de analytics en desarrollo</p>
            <p className="text-sm">
              Próximamente: gráficos de tendencias, análisis de cancelaciones, y métricas de rendimiento
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Gestión de Turnos</h1>
          <p className="text-muted-foreground">Administración integral de citas médicas con seguimiento completo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Confirmaciones
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Turno
          </Button>
        </div>
      </div>

      {/* Enhanced Navigation */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardView />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <CalendarView
            onTurnoClick={(turno) => {
              setSelectedTurno(turno as Turno)
              setShowManageModal(true)
            }}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <ListView />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsView />
        </TabsContent>
      </Tabs>

      {/* Enhanced Management Modal */}
      <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar Turno</DialogTitle>
            <DialogDescription>
              {selectedTurno?.pacientes?.nombre_apellido || `DNI: ${selectedTurno?.paciente_dni}`} -{" "}
              {selectedTurno && new Date(selectedTurno.fecha_horario_inicio).toLocaleDateString("es-AR")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Estado Actual</label>
                <div className="mt-1">
                  {selectedTurno && getStatusBadge(selectedTurno.estado, selectedTurno.prioridad)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Tratamiento</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTurno?.tratamientos?.nombre || "Consulta"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => updateTurnoStatus(selectedTurno!.id, "confirmado_clinica")}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirmar
              </Button>
              <Button size="sm" variant="outline" onClick={() => updateTurnoStatus(selectedTurno!.id, "en_curso")}>
                <Clock className="h-4 w-4 mr-1" />
                Iniciar
              </Button>
              <Button size="sm" variant="outline" onClick={() => updateTurnoStatus(selectedTurno!.id, "completado")}>
                Completar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateTurnoStatus(selectedTurno!.id, "cancelado_clinica")}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </div>

            <div className="flex gap-2">
              {selectedTurno?.pacientes?.telefono && (
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4 mr-1" />
                  Llamar
                </Button>
              )}
              {selectedTurno?.pacientes?.telefono && (
                <Button size="sm" variant="outline">
                  <WhatsApp className="h-4 w-4 mr-1" />
                  WhatsApp
                </Button>
              )}
              <Button size="sm" variant="outline">
                <History className="h-4 w-4 mr-1" />
                Historial
              </Button>
              <Button size="sm" variant="outline">
                <CreditCard className="h-4 w-4 mr-1" />
                Pagos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={hideNotification}
        title={notification.type === "success" ? "Éxito" : notification.type === "error" ? "Error" : "Información"}
        message={notification.message || ""}
        type={notification.type || "info"}
      />
    </div>
  )
}
