"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import PatientSidebar from "@/components/patient-sidebar"

export default function PacienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [paciente, setPaciente] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/paciente") return

    const pacienteData = sessionStorage.getItem("paciente")
    if (!pacienteData) {
      router.push("/paciente")
      return
    }

    setPaciente(JSON.parse(pacienteData))
  }, [pathname, router])

  // Show login page without sidebar
  if (pathname === "/paciente") {
    return children
  }

  // Show loading while checking auth
  if (!paciente) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <PatientSidebar paciente={paciente} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
