"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Info } from "lucide-react"
import { createClient } from "@/lib/client"

interface TimeSlot {
  time: string
  available: boolean
  turno?: any
}

export default function AgendarTurno() {
  const [paciente, setPaciente] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const pacienteData = sessionStorage.getItem("paciente")
    if (pacienteData) {
      setPaciente(JSON.parse(pacienteData))
    }
  }, [])

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots()
    }
  }, [selectedDate])

  const generateTimeSlots = async () => {
    try {
      const supabase = createClient()

      // Fetch existing appointments for the selected date
      const { data: turnos, error } = await supabase
        .from("turnos")
        .select("fecha_horario_inicio, fecha_horario_fin, estado")
        .gte("fecha_horario_inicio", `${selectedDate} 00:00:00`)
        .lt("fecha_horario_inicio", `${selectedDate} 23:59:59`)

      if (error) throw error

      // Generate hourly time slots from 9:00 to 17:00 (only :00 minutes)
      const slots: TimeSlot[] = []
      for (let hour = 9; hour <= 17; hour++) {
        const time = `${hour.toString().padStart(2, "0")}:00`
        const slotDateTime = new Date(`${selectedDate}T${time}:00`)

        // Check if this slot is occupied
        const isOccupied = turnos?.some((turno) => {
          const turnoStart = new Date(turno.fecha_horario_inicio)
          const turnoEnd = new Date(turno.fecha_horario_fin)
          return (
            slotDateTime >= turnoStart &&
            slotDateTime < turnoEnd &&
            !["cancelado_paciente", "cancelado_consultorio", "reprogramado"].includes(turno.estado)
          )
        })

        slots.push({
          time,
          available: !isOccupied && slotDateTime > new Date(),
        })
      }

      setTimeSlots(slots)
    } catch (error) {
      console.error("Error generating time slots:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Get the "Consulta" treatment ID
      const { data: consultaTratamiento, error: tratamientoError } = await supabase
        .from("tratamientos")
        .select("id")
        .eq("nombre", "Consulta")
        .single()

      if (tratamientoError || !consultaTratamiento) {
        throw new Error("Tratamiento de consulta no encontrado")
      }

      const fechaInicio = new Date(`${selectedDate}T${selectedTime}:00`)
      const fechaFin = new Date(fechaInicio.getTime() + 60 * 60000) // 60 minutes duration

      const { error } = await supabase.from("turnos").insert({
        paciente_dni: paciente.dni,
        tratamiento_id: consultaTratamiento.id,
        fecha_horario_inicio: fechaInicio.toISOString(),
        fecha_horario_fin: fechaFin.toISOString(),
        estado: "confirmado",
        observaciones,
      })

      if (error) throw error

      setSuccess(true)
      // Reset form
      setSelectedDate("")
      setSelectedTime("")
      setObservaciones("")
    } catch (error) {
      console.error("Error creating appointment:", error)
      alert("Error al agendar el turno. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">¡Turno Agendado!</h2>
            <p className="text-gray-600 mb-4">Su consulta ha sido confirmada exitosamente.</p>
            <Button onClick={() => setSuccess(false)}>Agendar Otra Consulta</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Agendar Consulta</h1>
          <p className="text-gray-600">Reserve su primera consulta con la doctora</p>
        </div>

        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Información importante sobre su primera consulta:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>
                    • Su primer turno será siempre una <strong>consulta de evaluación</strong>
                  </li>
                  <li>• La doctora evaluará su situación y determinará el tratamiento adecuado</li>
                  <li>
                    • Cada consulta tiene una duración de <strong>1 hora</strong>
                  </li>
                  <li>• Después de la consulta, se le asignará el tratamiento específico que necesite</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Consulta</CardTitle>
            <CardDescription>Seleccione fecha y horario para su consulta de evaluación</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Cita</Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="text-sm font-medium text-gray-900">Consulta de Evaluación</p>
                    <p className="text-xs text-gray-600">Duración: 1 hora</p>
                  </div>
                </div>
              </div>

              {selectedDate && (
                <div className="space-y-2">
                  <Label>Horarios Disponibles</Label>
                  <p className="text-sm text-gray-600 mb-3">Seleccione un horario (consultas cada hora en punto)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        type="button"
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        className={`text-sm ${!slot.available ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="observaciones">Motivo de la consulta o síntomas (Opcional)</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Describa brevemente el motivo de su consulta o síntomas que presenta..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !selectedDate || !selectedTime}>
                {loading ? "Agendando..." : "Agendar Consulta"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
