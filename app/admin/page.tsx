"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import CalendarView from "@/components/ui/calendar-view"
import AppointmentTimeline from "@/components/ui/appointment-timeline"
import { Calendar, Clock, User, Stethoscope, TrendingUp, DollarSign, AlertCircle, CheckCircle } from "lucide-react"

interface DashboardStats {
  totalPacientes: number
  turnosHoy: number
  turnosConfirmados: number
  turnosPendientes: number
  ingresosMes: number
  totalTratamientos: number
  totalProductos: number
  turnosCompletados: number
}

interface Turno {
  id: number
  fecha_horario_inicio: string
  fecha_horario_fin: string
  estado: string
  tipo_turno: string
  pacientes: {
    nombre_apellido: string
    telefono: string
  }
  tratamientos: {
    id: number
    nombre: string
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPacientes: 0,
    turnosHoy: 0,
    turnosConfirmados: 0,
    turnosPendientes: 0,
    ingresosMes: 0,
    totalTratamientos: 0,
    totalProductos: 0,
    turnosCompletados: 0,
  })
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString()

      const [
        pacientesRes,
        turnosHoyRes,
        turnosConfirmadosRes,
        turnosPendientesRes,
        ingresosMesRes,
        tratamientosRes,
        productosRes,
        turnosCompletadosRes,
      ] = await Promise.all([
        supabase.from("pacientes").select("id", { count: "exact" }),
        supabase
          .from("turnos")
          .select("id", { count: "exact" })
          .gte("fecha_horario_inicio", today)
          .lt("fecha_horario_inicio", today + "T23:59:59")
          .neq("estado", "cancelado"),
        supabase
          .from("turnos")
          .select("id", { count: "exact" })
          .in("estado", ["confirmado_paciente", "confirmado_clinica"]),
        supabase.from("turnos").select("id", { count: "exact" }).eq("estado", "reservado"),
        supabase.from("turnos_pagos").select("monto").gte("fecha_pago", startOfMonth).lte("fecha_pago", endOfMonth),
        supabase.from("tratamientos").select("id", { count: "exact" }),
        supabase.from("productos").select("id", { count: "exact" }),
        supabase
          .from("turnos")
          .select("id", { count: "exact" })
          .eq("estado", "completado")
          .gte("fecha_horario_inicio", startOfMonth)
          .lte("fecha_horario_inicio", endOfMonth),
      ])

      const ingresosTotales = ingresosMesRes.data?.reduce((sum, pago) => sum + (pago.monto || 0), 0) || 0

      setStats({
        totalPacientes: pacientesRes.count || 0,
        turnosHoy: turnosHoyRes.count || 0,
        turnosConfirmados: turnosConfirmadosRes.count || 0,
        turnosPendientes: turnosPendientesRes.count || 0,
        ingresosMes: ingresosTotales,
        totalTratamientos: tratamientosRes.count || 0,
        totalProductos: productosRes.count || 0,
        turnosCompletados: turnosCompletadosRes.count || 0,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleTurnoClick = (turno: any) => {
    setSelectedTurno(turno)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
        <p className="text-gray-600">Sistema de Gestión Dental - Dashboard Avanzado</p>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Totales</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalPacientes}</div>
            <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.turnosHoy}</div>
            <p className="text-xs text-muted-foreground">Programados para hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.turnosConfirmados}</div>
            <p className="text-xs text-muted-foreground">Turnos confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.turnosPendientes}</div>
            <p className="text-xs text-muted-foreground">Sin confirmar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${stats.ingresosMes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Pagos recibidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{stats.turnosCompletados}</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tratamientos</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{stats.totalTratamientos}</div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalProductos}</div>
            <p className="text-xs text-muted-foreground">En inventario</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <CalendarView onTurnoClick={handleTurnoClick} />

      {/* Appointment Detail Modal */}
      {selectedTurno && (
        <Dialog open={!!selectedTurno} onOpenChange={() => setSelectedTurno(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Información del Turno</h3>
                  <p>
                    <strong>Paciente:</strong> {selectedTurno.pacientes.nombre_apellido}
                  </p>
                  <p>
                    <strong>Tratamiento:</strong> {selectedTurno.tratamientos.nombre}
                  </p>
                  <p>
                    <strong>Tipo:</strong> {selectedTurno.tipo_turno}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Fecha y Hora</h3>
                  <p>
                    <strong>Fecha:</strong> {new Date(selectedTurno.fecha_horario_inicio).toLocaleDateString("es-ES")}
                  </p>
                  <p>
                    <strong>Hora:</strong>{" "}
                    {new Date(selectedTurno.fecha_horario_inicio).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(selectedTurno.fecha_horario_fin).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p>
                    <strong>Estado:</strong> <Badge className="ml-2">{selectedTurno.estado}</Badge>
                  </p>
                </div>
              </div>

              <AppointmentTimeline turnoId={selectedTurno.id} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
