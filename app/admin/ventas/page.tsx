"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Eye, ShoppingCart, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/client"

interface Venta {
  id: number
  fecha: string
  estado: string
  total: number
  observaciones?: string
  created_at: string
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const supabase = createClient()
  const router = useRouter()

  const months = [
    { value: "all", label: "Todos los meses" },
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i).map((year) => ({
    value: year.toString(),
    label: year.toString(),
  }))

  useEffect(() => {
    fetchVentas()
  }, [selectedMonth, selectedYear])

  const fetchVentas = async () => {
    try {
      setLoading(true)
      let query = supabase.from("ventas").select("*")

      // Apply month/year filters
      if (selectedMonth && selectedMonth !== "all" && selectedYear) {
        const startDate = `${selectedYear}-${selectedMonth}-01`
        const endDate = `${selectedYear}-${selectedMonth}-31`
        query = query.gte("fecha", startDate).lte("fecha", endDate)
      } else if (selectedYear && (selectedMonth === "all" || !selectedMonth)) {
        const startDate = `${selectedYear}-01-01`
        const endDate = `${selectedYear}-12-31`
        query = query.gte("fecha", startDate).lte("fecha", endDate)
      }

      const { data, error } = await query.order("fecha", { ascending: false })

      if (error) {
        if (error.message.includes("Could not find the table")) {
          console.error("Ventas table not found. Please run the SQL script to create the tables.")
          setVentas([])
          return
        }
        throw error
      }
      setVentas(data || [])
    } catch (error) {
      console.error("Error fetching ventas:", error)
      setVentas([])
    } finally {
      setLoading(false)
    }
  }

  const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0)
  const ventasPagadas = ventas.filter((venta) => venta.estado === "pagado").length
  const ventasReservadas = ventas.filter((venta) => venta.estado === "reservado").length

  const handleNuevaVenta = () => {
    console.log("[v0] Nueva Venta button clicked - starting navigation")
    console.log("[v0] Current router state:", router)
    console.log("[v0] Attempting to navigate to: /admin/ventas/nueva")

    try {
      router.push("/admin/ventas/nueva")
      console.log("[v0] router.push executed successfully")
    } catch (error) {
      console.error("[v0] Error during navigation:", error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-600">Gestionar ventas de productos</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700" onClick={handleNuevaVenta}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Venta
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {ventas.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Total Ventas</div>
              <div className="text-lg font-bold text-blue-900">{ventas.length}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Pagadas</div>
              <div className="text-lg font-bold text-green-900">{ventasPagadas}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-sm text-yellow-600 font-medium">Reservadas</div>
              <div className="text-lg font-bold text-yellow-900">{ventasReservadas}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Total Ingresos</div>
              <div className="text-lg font-bold text-purple-900">${totalVentas.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {ventas.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {(selectedMonth && selectedMonth !== "all") || selectedYear !== new Date().getFullYear().toString()
              ? "No hay ventas para el período seleccionado"
              : "No hay ventas registradas"}
          </h3>
          <p className="text-gray-500 mb-4">
            {(selectedMonth && selectedMonth !== "all") || selectedYear !== new Date().getFullYear().toString()
              ? "Intenta seleccionar un período diferente o registra una nueva venta."
              : "Para comenzar a usar el sistema de ventas, asegúrate de ejecutar el script SQL para crear las tablas necesarias."}
          </p>
          {(!selectedMonth || selectedMonth === "all") && selectedYear === new Date().getFullYear().toString() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> Si es la primera vez usando el sistema de ventas, ejecuta el script{" "}
                <code className="bg-yellow-100 px-1 rounded">scripts/create_ventas_tables.sql</code> desde la
                configuración del proyecto.
              </p>
            </div>
          )}
          <Button onClick={handleNuevaVenta}>
            {(selectedMonth && selectedMonth !== "all") || selectedYear !== new Date().getFullYear().toString()
              ? "Registrar Nueva Venta"
              : "Registrar Primera Venta"}
          </Button>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ventas.map((venta) => (
                <tr key={venta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{venta.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(venta.fecha).toLocaleDateString("es-ES")}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(venta.fecha).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        venta.estado === "pagado" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {venta.estado === "pagado" ? "Pagado" : "Reservado"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">${venta.total.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/ventas/${venta.id}`)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalle
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
