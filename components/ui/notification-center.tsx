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
  Bell,
  MessageCircle,
  Mail,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Plus,
  Eye,
} from "lucide-react"

interface NotificationTemplate {
  id: number
  nombre: string
  tipo: string
  canal: string
  asunto: string | null
  contenido: string
  variables: string[]
  activo: boolean
  created_at: string
}

interface ConfirmationRecord {
  id: string
  turno_id: number
  patient_phone: string
  message_content: string
  scheduled_send_time: string
  sent_at: string | null
  delivery_status: string
  response_status: string
  response_received_at: string | null
  response_content: string | null
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

interface NotificationStats {
  totalEnviadas: number
  pendientesEnvio: number
  confirmadas: number
  canceladas: number
  sinRespuesta: number
  fallidas: number
}

export default function NotificationCenter() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [confirmations, setConfirmations] = useState<ConfirmationRecord[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    totalEnviadas: 0,
    pendientesEnvio: 0,
    confirmadas: 0,
    canceladas: 0,
    sinRespuesta: 0,
    fallidas: 0,
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    nombre: "",
    tipo: "confirmacion",
    canal: "whatsapp",
    asunto: "",
    contenido: "",
    activo: true,
  })

  const supabase = createClient()
  const { showNotification } = useNotification()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchTemplates(), fetchConfirmations(), fetchStats()])
    } catch (error) {
      console.error("Error fetching notification data:", error)
      showNotification("Error al cargar los datos de notificaciones", "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("notification_templates")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    setTemplates(data || [])
  }

  const fetchConfirmations = async () => {
    const { data, error } = await supabase
      .from("turnos_confirmaciones")
      .select(`
        *,
        turnos!inner(
          fecha_horario_inicio,
          pacientes!inner(nombre_apellido),
          tratamientos!inner(nombre)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error
    setConfirmations(data || [])
  }

  const fetchStats = async () => {
    try {
      const [enviadas, pendientes, confirmadas, canceladas, sinRespuesta, fallidas] = await Promise.all([
        supabase.from("turnos_confirmaciones").select("id", { count: "exact" }).neq("sent_at", null),
        supabase.from("turnos_confirmaciones").select("id", { count: "exact" }).eq("delivery_status", "pending"),
        supabase.from("turnos_confirmaciones").select("id", { count: "exact" }).eq("response_status", "confirmed"),
        supabase.from("turnos_confirmaciones").select("id", { count: "exact" }).eq("response_status", "cancelled"),
        supabase.from("turnos_confirmaciones").select("id", { count: "exact" }).eq("response_status", "no_response"),
        supabase.from("turnos_confirmaciones").select("id", { count: "exact" }).eq("delivery_status", "failed"),
      ])

      setStats({
        totalEnviadas: enviadas.count || 0,
        pendientesEnvio: pendientes.count || 0,
        confirmadas: confirmadas.count || 0,
        canceladas: canceladas.count || 0,
        sinRespuesta: sinRespuesta.count || 0,
        fallidas: fallidas.count || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleCreateTemplate = async () => {
    if (!templateForm.nombre || !templateForm.contenido) {
      showNotification("Complete todos los campos requeridos", "error")
      return
    }

    try {
      const { error } = await supabase.from("notification_templates").insert({
        nombre: templateForm.nombre,
        tipo: templateForm.tipo,
        canal: templateForm.canal,
        asunto: templateForm.asunto || null,
        contenido: templateForm.contenido,
        variables: extractVariables(templateForm.contenido),
        activo: templateForm.activo,
      })

      if (error) throw error

      showNotification("Plantilla creada exitosamente", "success")
      setIsCreatingTemplate(false)
      setTemplateForm({
        nombre: "",
        tipo: "confirmacion",
        canal: "whatsapp",
        asunto: "",
        contenido: "",
        activo: true,
      })
      fetchTemplates()
    } catch (error) {
      console.error("Error creating template:", error)
      showNotification("Error al crear la plantilla", "error")
    }
  }

  const handleSendBulkConfirmations = async () => {
    try {
      const response = await fetch("/api/cron/whatsapp-confirmations", {
        method: "GET",
      })

      if (!response.ok) throw new Error("Error enviando confirmaciones")

      const result = await response.json()
      showNotification(`Confirmaciones enviadas: ${result.processed}`, "success")
      fetchConfirmations()
      fetchStats()
    } catch (error) {
      console.error("Error sending bulk confirmations:", error)
      showNotification("Error al enviar confirmaciones masivas", "error")
    }
  }

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{([^}]+)\}/g)
    return matches ? matches.map((match) => match.slice(1, -1)) : []
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      sent: "bg-blue-100 text-blue-800 border-blue-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      failed: "bg-red-100 text-red-800 border-red-200",
      confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      no_response: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enviadas</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalEnviadas}</div>
            <p className="text-xs text-muted-foreground">Notificaciones enviadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmadas}</div>
            <p className="text-xs text-muted-foreground">Pacientes confirmaron</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Respuesta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.sinRespuesta}</div>
            <p className="text-xs text-muted-foreground">Esperando respuesta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.canceladas}</div>
            <p className="text-xs text-muted-foreground">Pacientes cancelaron</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendientesEnvio}</div>
            <p className="text-xs text-muted-foreground">Por enviar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallidas</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.fallidas}</div>
            <p className="text-xs text-muted-foreground">Error en envío</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleSendBulkConfirmations} className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar Confirmaciones Pendientes
            </Button>
            <Button variant="outline" onClick={() => setActiveTab("templates")} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Gestionar Plantillas
            </Button>
            <Button variant="outline" onClick={() => setActiveTab("history")} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Ver Historial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Plantillas de Notificación</h3>
        <Dialog open={isCreatingTemplate} onOpenChange={setIsCreatingTemplate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nueva Plantilla</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre de la Plantilla</Label>
                  <Input
                    id="nombre"
                    value={templateForm.nombre}
                    onChange={(e) => setTemplateForm({ ...templateForm, nombre: e.target.value })}
                    placeholder="Ej: Confirmación de Cita"
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={templateForm.tipo}
                    onValueChange={(value) => setTemplateForm({ ...templateForm, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmacion">Confirmación</SelectItem>
                      <SelectItem value="recordatorio">Recordatorio</SelectItem>
                      <SelectItem value="cancelacion">Cancelación</SelectItem>
                      <SelectItem value="reprogramacion">Reprogramación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="canal">Canal</Label>
                  <Select
                    value={templateForm.canal}
                    onValueChange={(value) => setTemplateForm({ ...templateForm, canal: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {templateForm.canal === "email" && (
                  <div>
                    <Label htmlFor="asunto">Asunto</Label>
                    <Input
                      id="asunto"
                      value={templateForm.asunto}
                      onChange={(e) => setTemplateForm({ ...templateForm, asunto: e.target.value })}
                      placeholder="Asunto del email"
                    />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="contenido">Contenido del Mensaje</Label>
                <Textarea
                  id="contenido"
                  value={templateForm.contenido}
                  onChange={(e) => setTemplateForm({ ...templateForm, contenido: e.target.value })}
                  placeholder="Hola {nombre_paciente}, te recordamos tu cita el {fecha_cita} a las {hora_cita}..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variables disponibles: {"{nombre_paciente}"}, {"{fecha_cita}"}, {"{hora_cita}"}, {"{tratamiento}"}
                </p>
              </div>
              <Button onClick={handleCreateTemplate} className="w-full">
                Crear Plantilla
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{template.nombre}</CardTitle>
                <Badge className={template.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {template.activo ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {template.canal === "whatsapp" && <MessageCircle className="h-4 w-4" />}
                  {template.canal === "email" && <Mail className="h-4 w-4" />}
                  <span className="capitalize">{template.canal}</span>
                  <span>•</span>
                  <span className="capitalize">{template.tipo}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">{template.contenido}</p>
                {template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.variables.slice(0, 3).map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                    {template.variables.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.variables.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderHistory = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Historial de Confirmaciones</h3>
      <Card>
        <CardContent>
          {confirmations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay confirmaciones para mostrar</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Paciente</th>
                    <th className="text-left py-3 px-2">Tratamiento</th>
                    <th className="text-left py-3 px-2">Fecha Cita</th>
                    <th className="text-left py-3 px-2">Estado Envío</th>
                    <th className="text-left py-3 px-2">Respuesta</th>
                    <th className="text-left py-3 px-2">Enviado</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmations.map((confirmation) => (
                    <tr key={confirmation.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 text-sm">{confirmation.turnos.pacientes.nombre_apellido}</td>
                      <td className="py-3 px-2 text-sm">{confirmation.turnos.tratamientos.nombre}</td>
                      <td className="py-3 px-2 text-sm">
                        {new Date(confirmation.turnos.fecha_horario_inicio).toLocaleDateString("es-ES")}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(confirmation.delivery_status)}
                          <Badge className={getStatusBadge(confirmation.delivery_status)}>
                            {confirmation.delivery_status.toUpperCase()}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(confirmation.response_status)}
                          <Badge className={getStatusBadge(confirmation.response_status)}>
                            {confirmation.response_status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {confirmation.sent_at
                          ? new Date(confirmation.sent_at).toLocaleDateString("es-ES")
                          : "No enviado"}
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

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "dashboard" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("dashboard")}
          className="flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant={activeTab === "templates" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("templates")}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Plantillas
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("history")}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Historial
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "templates" && renderTemplates()}
          {activeTab === "history" && renderHistory()}
        </>
      )}
    </div>
  )
}
