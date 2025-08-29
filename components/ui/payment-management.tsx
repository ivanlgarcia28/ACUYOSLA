"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useNotification } from "@/components/ui/notification-modal"
import {
  CreditCard,
  DollarSign,
  Calendar,
  User,
  Plus,
  Eye,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Receipt,
} from "lucide-react"

interface Payment {
  id: number
  turno_id: number
  monto_total: number
  monto_pagado: number
  estado_pago: string
  metodo_pago: string
  fecha_pago: string | null
  observaciones: string | null
  created_at: string
  turnos: {
    fecha_horario_inicio: string
    pacientes: {
      nombre_apellido: string
    }
    tratamientos: {
      nombre: string
    }
  }
}

interface PaymentStats {
  totalIngresos: number
  pagosPendientes: number
  pagosCompletados: number
  pagosVencidos: number
  ingresosMes: number
  ingresosDia: number
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalIngresos: 0,
    pagosPendientes: 0,
    pagosCompletados: 0,
    pagosVencidos: 0,
    ingresosMes: 0,
    ingresosDia: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  const [filter, setFilter] = useState("todos")

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    monto_pagado: "",
    metodo_pago: "",
    observaciones: "",
  })

  const supabase = createClient()
  const { showNotification } = useNotification()

  useEffect(() => {
    fetchPayments()
    fetchStats()
  }, [filter])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("turnos_pagos")
        .select(`
          *,
          turnos!inner(
            fecha_horario_inicio,
            pacientes!inner(nombre_apellido),
            tratamientos!inner(nombre)
          )
        `)
        .order("created_at", { ascending: false })

      if (filter !== "todos") {
        query = query.eq("estado_pago", filter)
      }

      const { data, error } = await query

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error("Error fetching payments:", error)
      showNotification("Error al cargar los pagos", "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

      const [totalRes, pendientesRes, completadosRes, mesRes, diaRes] = await Promise.all([
        supabase.from("turnos_pagos").select("monto_pagado").eq("estado_pago", "pagado"),
        supabase.from("turnos_pagos").select("id", { count: "exact" }).eq("estado_pago", "pendiente"),
        supabase.from("turnos_pagos").select("id", { count: "exact" }).eq("estado_pago", "pagado"),
        supabase
          .from("turnos_pagos")
          .select("monto_pagado")
          .eq("estado_pago", "pagado")
          .gte("fecha_pago", startOfMonth),
        supabase
          .from("turnos_pagos")
          .select("monto_pagado")
          .eq("estado_pago", "pagado")
          .gte("fecha_pago", today)
          .lt("fecha_pago", today + "T23:59:59"),
      ])

      const totalIngresos = totalRes.data?.reduce((sum, p) => sum + (p.monto_pagado || 0), 0) || 0
      const ingresosMes = mesRes.data?.reduce((sum, p) => sum + (p.monto_pagado || 0), 0) || 0
      const ingresosDia = diaRes.data?.reduce((sum, p) => sum + (p.monto_pagado || 0), 0) || 0

      setStats({
        totalIngresos,
        pagosPendientes: pendientesRes.count || 0,
        pagosCompletados: completadosRes.count || 0,
        pagosVencidos: 0, // TODO: Calculate based on appointment dates
        ingresosMes,
        ingresosDia,
      })
    } catch (error) {
      console.error("Error fetching payment stats:", error)
    }
  }

  const handleAddPayment = async () => {
    if (!selectedPayment || !paymentForm.monto_pagado || !paymentForm.metodo_pago) {
      showNotification("Complete todos los campos requeridos", "error")
      return
    }

    try {
      const response = await fetch(`/api/turnos/${selectedPayment.turno_id}/pago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto_pagado: Number.parseFloat(paymentForm.monto_pagado),
          metodo_pago: paymentForm.metodo_pago,
          observaciones: paymentForm.observaciones,
        }),
      })

      if (!response.ok) throw new Error("Error al registrar el pago")

      showNotification("Pago registrado exitosamente", "success")
      setIsAddingPayment(false)
      setPaymentForm({ monto_pagado: "", metodo_pago: "", observaciones: "" })
      fetchPayments()
      fetchStats()
    } catch (error) {
      console.error("Error adding payment:", error)
      showNotification("Error al registrar el pago", "error")
    }
  }

  const getEstadoBadge = (estado: string) => {
    const variants = {
      pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
      parcial: "bg-blue-100 text-blue-800 border-blue-200",
      pagado: "bg-green-100 text-green-800 border-green-200",
      vencido: "bg-red-100 text-red-800 border-red-200",
    }
    return variants[estado as keyof typeof variants] || "bg-gray-100 text-gray-800"
  }

  const getMetodoPagoIcon = (metodo: string) => {
    switch (metodo?.toLowerCase()) {
      case "efectivo":
        return <DollarSign className="h-4 w-4" />
      case "tarjeta":
      case "stripe":
        return <CreditCard className="h-4 w-4" />
      default:
        return <Receipt className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalIngresos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Todos los pagos completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${stats.ingresosMes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Mes actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos de Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${stats.ingresosDia.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Día actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.pagosCompletados}</div>
            <p className="text-xs text-muted-foreground">Pagos finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pagosPendientes}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pagosVencidos}</div>
            <p className="text-xs text-muted-foreground">Requieren seguimiento</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Gestión de Pagos
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los pagos</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="parcial">Parciales</SelectItem>
                  <SelectItem value="pagado">Completados</SelectItem>
                  <SelectItem value="vencido">Vencidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : payments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay pagos para mostrar</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Paciente</th>
                    <th className="text-left py-3 px-2">Tratamiento</th>
                    <th className="text-left py-3 px-2">Fecha Turno</th>
                    <th className="text-left py-3 px-2">Monto Total</th>
                    <th className="text-left py-3 px-2">Pagado</th>
                    <th className="text-left py-3 px-2">Estado</th>
                    <th className="text-left py-3 px-2">Método</th>
                    <th className="text-left py-3 px-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{payment.turnos.pacientes.nombre_apellido}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm">{payment.turnos.tratamientos.nombre}</td>
                      <td className="py-3 px-2 text-sm">
                        {new Date(payment.turnos.fecha_horario_inicio).toLocaleDateString("es-ES")}
                      </td>
                      <td className="py-3 px-2 text-sm font-medium">${payment.monto_total.toLocaleString()}</td>
                      <td className="py-3 px-2 text-sm font-medium text-green-600">
                        ${payment.monto_pagado.toLocaleString()}
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={getEstadoBadge(payment.estado_pago)}>
                          {payment.estado_pago.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-1">
                          {getMetodoPagoIcon(payment.metodo_pago)}
                          <span className="text-sm">{payment.metodo_pago || "N/A"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedPayment(payment)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalles del Pago</DialogTitle>
                              </DialogHeader>
                              {selectedPayment && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Paciente</Label>
                                      <p className="text-sm">{selectedPayment.turnos.pacientes.nombre_apellido}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Tratamiento</Label>
                                      <p className="text-sm">{selectedPayment.turnos.tratamientos.nombre}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Monto Total</Label>
                                      <p className="text-sm font-medium">
                                        ${selectedPayment.monto_total.toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Monto Pagado</Label>
                                      <p className="text-sm font-medium text-green-600">
                                        ${selectedPayment.monto_pagado.toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Estado</Label>
                                      <Badge className={getEstadoBadge(selectedPayment.estado_pago)}>
                                        {selectedPayment.estado_pago.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Método de Pago</Label>
                                      <p className="text-sm">{selectedPayment.metodo_pago || "N/A"}</p>
                                    </div>
                                  </div>
                                  {selectedPayment.observaciones && (
                                    <div>
                                      <Label className="text-sm font-medium">Observaciones</Label>
                                      <p className="text-sm">{selectedPayment.observaciones}</p>
                                    </div>
                                  )}
                                  {selectedPayment.estado_pago !== "pagado" && (
                                    <div className="border-t pt-4">
                                      <h4 className="font-medium mb-3">Registrar Pago</h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor="monto">Monto a Pagar</Label>
                                          <Input
                                            id="monto"
                                            type="number"
                                            placeholder="0.00"
                                            value={paymentForm.monto_pagado}
                                            onChange={(e) =>
                                              setPaymentForm({ ...paymentForm, monto_pagado: e.target.value })
                                            }
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="metodo">Método de Pago</Label>
                                          <Select
                                            value={paymentForm.metodo_pago}
                                            onValueChange={(value) =>
                                              setPaymentForm({ ...paymentForm, metodo_pago: value })
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Seleccionar método" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="efectivo">Efectivo</SelectItem>
                                              <SelectItem value="tarjeta">Tarjeta</SelectItem>
                                              <SelectItem value="transferencia">Transferencia</SelectItem>
                                              <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <div className="mt-4">
                                        <Label htmlFor="observaciones">Observaciones</Label>
                                        <Textarea
                                          id="observaciones"
                                          placeholder="Observaciones adicionales..."
                                          value={paymentForm.observaciones}
                                          onChange={(e) =>
                                            setPaymentForm({ ...paymentForm, observaciones: e.target.value })
                                          }
                                        />
                                      </div>
                                      <Button onClick={handleAddPayment} className="mt-4">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Registrar Pago
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
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
