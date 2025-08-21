"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Calendar, Stethoscope, Package, Heart, ShoppingCart, BarChart3, Warehouse, LogOut } from "lucide-react"
import { signOut, type Usuario, type Permisos } from "@/lib/auth"
import { useRouter } from "next/navigation"

const navigationWithModules = [
  { name: "Dashboard", href: "/admin", icon: null, module: null },
  { name: "Pacientes", href: "/admin/pacientes", icon: Users, module: "pacientes" },
  { name: "Turnos", href: "/admin/turnos", icon: Calendar, module: "turnos" },
  { name: "Tratamientos", href: "/admin/tratamientos", icon: Stethoscope, module: "tratamientos" },
  { name: "Productos", href: "/admin/productos", icon: Package, module: "productos" },
  { name: "Inventario", href: "/admin/inventario", icon: Warehouse, module: "inventario" },
  { name: "Obras Sociales", href: "/admin/obras-sociales", icon: Heart, module: "obras_sociales" },
  { name: "Ventas", href: "/admin/ventas", icon: ShoppingCart, module: "ventas" },
  { name: "Reportes", href: "/admin/reportes", icon: BarChart3, module: "reportes" },
]

interface SidebarProps {
  user: Usuario | null
  permissions: Permisos
}

export function Sidebar({ user, permissions }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push("/admin/auth/login")
  }

  const visibleNavigation = navigationWithModules.filter((item) => {
    if (!item.module) return true // Dashboard is always visible
    return permissions[item.module]?.puede_ver || false
  })

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900">Consultorio Dental</h2>
        <p className="text-sm text-gray-500">Sistema de Gestión</p>
        {user && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">{user.nombre_completo}</p>
            <p className="text-xs text-gray-500 capitalize">{user.rol}</p>
          </div>
        )}
      </div>

      <nav className="mt-6 flex-1">
        {visibleNavigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {Icon && <Icon className="mr-3 h-5 w-5" />}
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-6 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}
