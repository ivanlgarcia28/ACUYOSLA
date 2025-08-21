"use client"

import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { getCurrentUser, getUserPermissions, type Usuario, type Permisos } from "@/lib/auth"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [permissions, setPermissions] = useState<Permisos>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    async function loadUserData() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/admin/auth/login")
          return
        }

        setUser(currentUser)
        const userPermissions = await getUserPermissions(currentUser.rol)
        setPermissions(userPermissions)
      } catch (error) {
        console.error("Error loading user data:", error)
        router.push("/admin/auth/login")
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  if (pathname === "/admin/auth/login") {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} permissions={permissions} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
