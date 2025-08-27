"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { NotificationModal, useNotification } from "@/components/ui/notification-modal"

export default function NuevoPacientePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [obrasSociales, setObrasSociales] = useState([])

  const [formData, setFormData] = useState({
    nombre_apellido: "",
    dni: "",
    email: "",
    telefono: "",
    obra_social: 1,
  })

  const { notification, showNotification, hideNotification } = useNotification()

  useEffect(() => {
    fetchObrasSociales()
  }, [])

  const fetchObrasSociales = async () => {
    const { data } = await supabase.from("obras_sociales").select("*").eq("activa", true).order("nombre")

    if (data) setObrasSociales(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("pacientes").insert([formData])

      if (error) throw error

      router.push("/admin/pacientes")
    } catch (error) {
      console.error("Error:", error)
      showNotification("Error al crear paciente", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/pacientes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Paciente</h1>
          <p className="text-gray-600">Agregar un nuevo paciente al sistema</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Paciente</CardTitle>
          <CardDescription>Complete todos los campos requeridos</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre_apellido">Nombre y Apellido *</Label>
                <Input
                  id="nombre_apellido"
                  value={formData.nombre_apellido}
                  onChange={(e) => setFormData({ ...formData, nombre_apellido: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="dni">DNI *</Label>
                <Input
                  id="dni"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="obra_social">Obra Social *</Label>
                <Select
                  value={formData.obra_social.toString()}
                  onValueChange={(value) => setFormData({ ...formData, obra_social: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar obra social" />
                  </SelectTrigger>
                  <SelectContent>
                    {obrasSociales.map((obra: any) => (
                      <SelectItem key={obra.id} value={obra.id.toString()}>
                        {obra.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Crear Paciente"}
              </Button>
              <Link href="/admin/pacientes">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={hideNotification}
        message={notification.message}
        type={notification.type}
        title={notification.title}
      />
    </div>
  )
}
