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
import { Calendar, Search, Plus, Clock, CheckCircle, AlertCircle, Users, TrendingUp, BarChart3 } from "lucide-react"

interface Turno {
  id: number
  paciente_dni: string
  tratamiento_id: number
  fecha_horario_inicio: string
  fecha_horario_fin: string
  estado: string
  calendar_id: string
  observaciones?: string
  pacientes?: {
    nombre_apellido: string
  }
  tratamientos?: {
    nombre: string
  }
  created_at?: string
}

interface DashboardStats {
  totalTurnos: number
  turnosHoy: number
  confirmados: number
  pendientes: number
  cancelados: number
  ingresos: number
}

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [filteredTurnos, setFilteredTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<"dashboard" | "calendar" | "list">("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("today")
  const [stats, setStats] = useState<DashboardStats>({
    totalTurnos: 0,
    turnosHoy: 0,
    confirmados: 0,
    pendientes: 0,
    cancelados: 0,
    ingresos: 0,
  })

  const { notification, showNotification, hideNotification } = useNotification()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchTurnos()
  }, [])

  useEffect(() => {
    filterTurnos()
  }, [turnos, searchTerm, statusFilter, dateFilter])

  const fetchTurnos = async () => {
    try {
      setLoading(true)
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
        .neq("estado", "reprogramado_paciente")
        .order("fecha_horario_inicio", { ascending: true })

      if (error) throw error

      setTurnos(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error("Error fetching turnos:", error)
      showNotification("Error al cargar los turnos", "error")
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (turnosData: Turno[]) => {
    const today = new Date().toISOString().split("T")[0]
    const turnosHoy = turnosData.filter((t) => new Date(t.fecha_horario_inicio).toISOString().split("T")[0] === today)

    setStats({
      totalTurnos: turnosData.length,
      turnosHoy: turnosHoy.length,
      confirmados: turnosData.filter((t) => t.estado === "confirmado" || t.estado === "confirmado_paciente").length,
      pendientes: turnosData.filter((t) => t.estado === "reservado").length,
      cancelados: turnosData.filter((t) => t.estado === "cancelado" || t.estado === "cancelado_paciente").length,
      ingresos: 0, // TODO: Calculate from payments
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
          turno.paciente_dni.includes(searchTerm),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((turno) => turno.estado === statusFilter)
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

  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      reservado: { color: "bg-yellow-100 text-yellow-800", label: "Reservado" },
      confirmado: { color: "bg-green-100 text-green-800", label: "Confirmado" },
      confirmado_paciente: { color: "bg-blue-100 text-blue-800", label: "Confirmado Paciente" },
      cancelado: { color: "bg-red-100 text-red-800", label: "Cancelado" },
      cancelado_paciente: { color: "bg-red-100 text-red-800", label: "Cancelado Paciente" },
      completado: { color: "bg-emerald-100 text-emerald-800", label: "Completado" },
      no_asistio: { color: "bg-gray-100 text-gray-800", label: "No Asistió" },
    }

    const config = statusConfig[estado as keyof typeof statusConfig] || {
      color: "bg-gray-100 text-gray-800",
      label: estado,
    }

    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>
  }

  const DashboardView = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.turnosHoy}</div>
            <p className="text-xs text-muted-foreground">
              {stats.turnosHoy > 0
                ? `${Math.round((stats.confirmados / stats.turnosHoy) * 100)}% confirmados`
                : "Sin turnos"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmados}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTurnos > 0 ? `${Math.round((stats.confirmados / stats.totalTurnos) * 100)}% del total` : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
            <p className="text-xs text-muted-foreground">Requieren confirmación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTurnos}</div>
            <p className="text-xs text-muted-foreground">Este período</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Gestiona turnos de manera eficiente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setActiveView("calendar")} className="bg-blue-600 hover:bg-blue-700">
              <Calendar className="h-4 w-4 mr-2" />
              Ver Calendario
            </Button>
            <Button onClick={() => setActiveView("list")} variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Vista Lista
            </Button>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Turno
            </Button>
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Reportes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Turnos</CardTitle>
          <CardDescription>Turnos programados para hoy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTurnos.slice(0, 5).map((turno) => (
              <div key={turno.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
                <div className="flex items-center space-x-2">{getStatusBadge(turno.estado)}</div>
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
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por paciente, DNI o tratamiento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="reservado">Reservado</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="confirmado_paciente">Confirmado Paciente</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Turnos ({filteredTurnos.length})</CardTitle>
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
                <p className="text-muted-foreground">No se encontraron turnos con los filtros aplicados</p>
              </div>
            ) : (
              filteredTurnos.map((turno) => (
                <div key={turno.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">
                          {turno.pacientes?.nombre_apellido || `DNI: ${turno.paciente_dni}`}
                        </h3>
                        {getStatusBadge(turno.estado)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          📅 {new Date(turno.fecha_horario_inicio).toLocaleDateString("es-AR")} -{" "}
                          {new Date(turno.fecha_horario_inicio).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p>🦷 {turno.tratamientos?.nombre || "Consulta"}</p>
                        {turno.observaciones && <p>📝 {turno.observaciones}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Ver Detalles
                      </Button>
                      <Button size="sm" variant="outline">
                        Gestionar
                      </Button>
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Turnos</h1>
          <p className="text-muted-foreground">Sistema integral de administración de citas</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Turno
        </Button>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
        <TabsList className="grid w-full grid-cols-3 lg:w-96">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardView />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Vista de Calendario</CardTitle>
              <CardDescription>Visualiza y gestiona turnos en formato calendario</CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <ListView />
        </TabsContent>
      </Tabs>

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
