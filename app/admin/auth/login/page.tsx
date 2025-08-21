"use client"

import type React from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Attempting login with email:", email)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.log("[v0] Supabase auth error:", error)
        throw error
      }

      console.log("[v0] Supabase auth successful, checking usuarios_sistema table")

      const { data: usuario, error: userError } = await supabase
        .from("usuarios_sistema")
        .select("*")
        .eq("email", email)
        .eq("activo", true)
        .single()

      console.log("[v0] Usuario query result:", { usuario, userError })

      if (userError || !usuario) {
        console.log("[v0] User not found in usuarios_sistema or not active")
        throw new Error("Usuario no autorizado para acceder al panel administrativo")
      }

      console.log("[v0] Login successful, redirecting to admin")

      router.refresh()
      router.push("/admin")
    } catch (error: unknown) {
      console.log("[v0] Login error:", error)
      setError(error instanceof Error ? error.message : "Error de autenticación")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <img src="/images/ele-odontologia-logo.png" alt="Ele Odontología" className="w-16 h-16 mx-auto mb-4" />
            <CardTitle className="text-2xl">Panel Administrativo</CardTitle>
            <CardDescription>Ingrese sus credenciales para acceder</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@eleodontologia.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
