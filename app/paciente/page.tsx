"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/client"
import { MessageCircle } from "lucide-react"

export default function PacienteLogin() {
  const [dni, setDni] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { data: paciente, error } = await supabase.from("pacientes").select("*").eq("dni", dni).single()

      if (error || !paciente) {
        setError("DNI no encontrado. Verifique el número ingresado.")
        return
      }

      // Store patient info in sessionStorage
      sessionStorage.setItem("paciente", JSON.stringify(paciente))
      router.push("/paciente/dashboard")
    } catch (err) {
      setError("Error al verificar el DNI. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/images/ele-odontologia-logo.png"
              alt="Ele Odontología Logo"
              className="w-24 h-24 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Pacientes Ele Odontología</CardTitle>
          <CardDescription>Ingrese su DNI para acceder a sus turnos e historial médico</CardDescription>
        </CardHeader>
        <CardContent>
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

            {error && <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

            <Button type="submit" className="w-full" disabled={loading || !dni}>
              {loading ? "Verificando..." : "Ingresar"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>¿No encuentra su DNI?</p>
            <p>Contacte al consultorio para registrarse</p>
            <a
              href="https://wa.me/5493875350657"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <MessageCircle size={18} />
              WhatsApp: +54 9 387 535 0657
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
