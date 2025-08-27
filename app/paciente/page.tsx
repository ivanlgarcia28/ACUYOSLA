"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { MessageCircle, UserPlus } from "lucide-react"
import { formatArgentinaPhone, isValidWhatsAppPhone, formatPhoneForDisplay } from "@/lib/utils/phone-formatter"

interface ObraSocial {
  id: number
  nombre: string
  activa: boolean
}

export default function PacienteLogin() {
  const [dni, setDni] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showRegistration, setShowRegistration] = useState(false)
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([])

  // Registration form fields
  const [registrationData, setRegistrationData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    fecha_nacimiento: "",
    direccion: "",
    obra_social: "",
  })

  const router = useRouter()

  useEffect(() => {
    const loadObrasSociales = async () => {
      try {
        const response = await fetch("/api/obras-sociales")
        if (response.ok) {
          const data = await response.json()
          setObrasSociales(data)
        } else {
          throw new Error("Failed to fetch obras sociales")
        }
      } catch (err) {
        console.error("Error loading obras sociales:", err)
        setObrasSociales([{ id: 1, nombre: "Particular", activa: true }])
      }
    }

    if (showRegistration) {
      loadObrasSociales()
    }
  }, [showRegistration])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { data: paciente, error } = await supabase.from("pacientes").select("*").eq("dni", dni).single()

      if (error || !paciente) {
        setError("DNI no encontrado. ¿Desea registrarse como nuevo paciente?")
        return
      }

      sessionStorage.setItem("paciente", JSON.stringify(paciente))
      router.push("/paciente/dashboard")
    } catch (err) {
      setError("Error al verificar el DNI. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()

      const { data: existingPatient } = await supabase.from("pacientes").select("dni").eq("dni", dni).single()

      if (existingPatient) {
        setError("Este DNI ya está registrado. Use la opción de ingreso.")
        setLoading(false)
        return
      }

      const obraSocialId = Number.parseInt(registrationData.obra_social)

      const { data: newPatient, error } = await supabase
        .from("pacientes")
        .insert([
          {
            dni,
            nombre_apellido: `${registrationData.nombre} ${registrationData.apellido}`,
            telefono: registrationData.telefono,
            email: registrationData.email,
            obra_social: obraSocialId,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Registration error:", error)
        setError("Error al registrar el paciente. Intente nuevamente.")
        return
      }

      sessionStorage.setItem("paciente", JSON.stringify(newPatient))
      router.push("/paciente/dashboard")
    } catch (err) {
      console.error("Registration error:", err)
      setError("Error al registrar el paciente. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleRegistrationInputChange = (field: string, value: string) => {
    if (field === "telefono") {
      const formattedPhone = formatArgentinaPhone(value)
      setRegistrationData((prev) => ({
        ...prev,
        [field]: formattedPhone,
      }))
    } else {
      setRegistrationData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const isRegistrationFormValid = () => {
    return (
      dni.trim() !== "" &&
      registrationData.nombre.trim() !== "" &&
      registrationData.apellido.trim() !== "" &&
      registrationData.telefono.trim() !== "" &&
      registrationData.fecha_nacimiento.trim() !== "" &&
      registrationData.obra_social.trim() !== ""
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-4xl">E</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {showRegistration ? "Registro de Paciente" : "Pacientes Ele Odontología"}
          </CardTitle>
          <CardDescription>
            {showRegistration
              ? "Complete sus datos para registrarse como nuevo paciente"
              : "Ingrese su DNI para acceder a sus turnos e historial médico"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showRegistration ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dni">Número de DNI</Label>
                <Input
                  id="dni"
                  type="text"
                  placeholder="Ej: 12345678"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  required
                  className="text-center text-lg"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                  {error}
                  {error.includes("no encontrado") && (
                    <Button
                      type="button"
                      variant="link"
                      className="text-blue-600 p-0 h-auto ml-2"
                      onClick={() => {
                        setShowRegistration(true)
                        setError("")
                      }}
                    >
                      Registrarse aquí
                    </Button>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || !dni}>
                {loading ? "Verificando..." : "Ingresar"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setShowRegistration(true)
                    setError("")
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Registrarse como nuevo paciente
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegistration} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-dni">Número de DNI</Label>
                <Input
                  id="reg-dni"
                  type="text"
                  placeholder="Ej: 12345678"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    type="text"
                    placeholder="Juan"
                    value={registrationData.nombre}
                    onChange={(e) => handleRegistrationInputChange("nombre", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    type="text"
                    placeholder="Pérez"
                    value={registrationData.apellido}
                    onChange={(e) => handleRegistrationInputChange("apellido", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="0387 155350665 o +54 9 387 535 0665"
                  value={formatPhoneForDisplay(registrationData.telefono)}
                  onChange={(e) => handleRegistrationInputChange("telefono", e.target.value)}
                  required
                />
                {registrationData.telefono && !isValidWhatsAppPhone(registrationData.telefono) && (
                  <p className="text-xs text-amber-600">
                    Formato sugerido: 0387 155350665 (se formateará automáticamente)
                  </p>
                )}
                {registrationData.telefono && isValidWhatsAppPhone(registrationData.telefono) && (
                  <p className="text-xs text-green-600">✓ Número válido para WhatsApp: {registrationData.telefono}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@email.com"
                  value={registrationData.email}
                  onChange={(e) => handleRegistrationInputChange("email", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={registrationData.fecha_nacimiento}
                  onChange={(e) => handleRegistrationInputChange("fecha_nacimiento", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  type="text"
                  placeholder="Calle 123, Salta"
                  value={registrationData.direccion}
                  onChange={(e) => handleRegistrationInputChange("direccion", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="obra_social">Obra Social *</Label>
                <Select
                  value={registrationData.obra_social}
                  onValueChange={(value) => handleRegistrationInputChange("obra_social", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione su obra social" />
                  </SelectTrigger>
                  <SelectContent>
                    {obrasSociales.map((obra) => (
                      <SelectItem key={obra.id} value={obra.id.toString()}>
                        {obra.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600 mt-1">
                  Si su obra social no está en la lista, es porque no se recibe. Puede seleccionar "Particular".
                </p>
              </div>

              {error && <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={loading || !isRegistrationFormValid()}>
                  {loading ? "Registrando..." : "Registrarse"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setShowRegistration(false)
                    setError("")
                  }}
                >
                  Volver al ingreso
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>¿Necesita ayuda?</p>
            <a
              href="https://wa.me/5493875350657"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <MessageCircle size={18} />
              WhatsApp: +54 9 387 535 0665
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
