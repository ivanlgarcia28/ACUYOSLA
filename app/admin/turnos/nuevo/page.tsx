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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Plus, Search } from "lucide-react"
import Link from "next/link"

export default function NuevoTurnoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [pacientes, setPacientes] = useState([])
  const [filteredPacientes, setFilteredPacientes] = useState([])
  const [tratamientos, setTratamientos] = useState([])
  const [obrasSociales, setObrasSociales] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewPatientModal, setShowNewPatientModal] = useState(false)
  const [newPatientLoading, setNewPatientLoading] = useState(false)

  const [formData, setFormData] = useState({
    paciente_dni: "",
    tratamiento_id: "",
    fecha: "",
    hora: "",
    duracion: 60,
    estado: "reservado",
  })

  const [newPatientData, setNewPatientData] = useState({
    nombre_apellido: "",
    dni: "",
    email: "",
    telefono: "",
    obra_social: 1,
  })

  useEffect(() => {
    fetchPacientes()
    fetchTratamientos()
    fetchObrasSociales()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPacientes(pacientes)
    } else {
      const filtered = pacientes.filter((paciente: any) => {
        const matchesName = paciente.nombre_apellido?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesDni = paciente.dni?.toString().includes(searchTerm)
        return matchesName || matchesDni
      })
      setFilteredPacientes(filtered)
    }
  }, [searchTerm, pacientes])

  const fetchPacientes = async () => {
    const { data, error } = await supabase.from("pacientes").select("dni, nombre_apellido").order("nombre_apellido")

    if (error) {
      console.error("Error fetching pacientes:", error)
      return
    }

    if (data) {
      setPacientes(data)
      setFilteredPacientes(data)
    }
  }

  const fetchTratamientos = async () => {
    const { data } = await supabase.from("tratamientos").select("*").order("nombre")

    if (data) setTratamientos(data)
  }

  const fetchObrasSociales = async () => {
    const { data } = await supabase.from("obras_sociales").select("*").order("nombre")
    if (data) setObrasSociales(data)
  }

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    setNewPatientLoading(true)

    try {
      const { data, error } = await supabase.from("pacientes").insert([newPatientData]).select().single()

      if (error) throw error

      // Refresh patients list
      await fetchPacientes()

      // Auto-select the new patient
      setFormData({ ...formData, paciente_dni: data.dni })

      // Close modal and reset form
      setShowNewPatientModal(false)
      setNewPatientData({
        nombre_apellido: "",
        dni: "",
        email: "",
        telefono: "",
        obra_social: 1,
      })

      alert("Paciente creado exitosamente")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al crear paciente")
    } finally {
      setNewPatientLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const fechaHoraInicio = new Date(`${formData.fecha}T${formData.hora}`)
      const fechaHoraFin = new Date(fechaHoraInicio.getTime() + formData.duracion * 60000)

      const { error } = await supabase.from("turnos").insert([
        {
          paciente_dni: formData.paciente_dni,
          tratamiento_id: Number.parseInt(formData.tratamiento_id),
          fecha_horario_inicio: fechaHoraInicio.toISOString(),
          fecha_horario_fin: fechaHoraFin.toISOString(),
          estado: formData.estado,
          calendar_id: `turno_${Date.now()}`,
        },
      ])

      if (error) throw error

      router.push("/admin/turnos")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al crear turno")
    } finally {
      setLoading(false)
    }
  }

  const handleTratamientoChange = (value: string) => {
    const tratamiento = tratamientos.find((t: any) => t.id.toString() === value)
    setFormData({
      ...formData,
      tratamiento_id: value,
      duracion: tratamiento?.duracion_minutos || 60,
    })
  }

  const handlePatientSelect = (dni: string) => {
    setFormData({ ...formData, paciente_dni: dni })
    setSearchTerm("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/turnos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Turno</h1>
          <p className="text-gray-600">Programar un nuevo turno</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Turno</CardTitle>
          <CardDescription>Complete todos los campos requeridos</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paciente_dni">Paciente *</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por nombre o DNI..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    {searchTerm && filteredPacientes.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredPacientes.map((paciente: any) => (
                          <button
                            key={paciente.dni}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            onClick={() => handlePatientSelect(paciente.dni)}
                          >
                            <div className="font-medium">{paciente.nombre_apellido}</div>
                            <div className="text-sm text-gray-500">DNI: {paciente.dni}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={formData.paciente_dni}
                      onValueChange={(value) => setFormData({ ...formData, paciente_dni: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {(searchTerm ? filteredPacientes : pacientes).map((paciente: any) => (
                          <SelectItem key={paciente.dni} value={paciente.dni}>
                            {paciente.nombre_apellido} - DNI: {paciente.dni}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Dialog open={showNewPatientModal} onOpenChange={setShowNewPatientModal}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Nuevo Paciente</DialogTitle>
                          <DialogDescription>Registrar un nuevo paciente para el turno</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreatePatient} className="space-y-4">
                          <div>
                            <Label htmlFor="nombre_apellido">Nombre y Apellido *</Label>
                            <Input
                              id="nombre_apellido"
                              value={newPatientData.nombre_apellido}
                              onChange={(e) =>
                                setNewPatientData({ ...newPatientData, nombre_apellido: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="dni">DNI *</Label>
                            <Input
                              id="dni"
                              value={newPatientData.dni}
                              onChange={(e) => setNewPatientData({ ...newPatientData, dni: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={newPatientData.email}
                              onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input
                              id="telefono"
                              value={newPatientData.telefono}
                              onChange={(e) => setNewPatientData({ ...newPatientData, telefono: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="obra_social">Obra Social</Label>
                            <Select
                              value={newPatientData.obra_social.toString()}
                              onValueChange={(value) =>
                                setNewPatientData({ ...newPatientData, obra_social: Number.parseInt(value) })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
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
                          <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={newPatientLoading} className="flex-1">
                              {newPatientLoading ? "Creando..." : "Crear Paciente"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowNewPatientModal(false)}>
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="tratamiento_id">Tratamiento *</Label>
                <Select value={formData.tratamiento_id} onValueChange={handleTratamientoChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tratamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {tratamientos.map((tratamiento: any) => (
                      <SelectItem key={tratamiento.id} value={tratamiento.id.toString()}>
                        {tratamiento.nombre} ({tratamiento.duracion_minutos} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="hora">Hora *</Label>
                <Input
                  id="hora"
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reservado">Reservado</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="reprogramado">Reprogramado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duracion">Duración (minutos)</Label>
                <Input
                  id="duracion"
                  type="number"
                  value={formData.duracion}
                  onChange={(e) => setFormData({ ...formData, duracion: Number.parseInt(e.target.value) })}
                  min="15"
                  step="15"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Crear Turno"}
              </Button>
              <Link href="/admin/turnos">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
