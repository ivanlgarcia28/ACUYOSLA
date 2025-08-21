"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, ShoppingCart, Calendar, DollarSign, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/client"

interface VentaDetalle {
  id: number
  fecha: string
  estado: string
  total: number
  observaciones?: string
  created_at: string
}

interface DetalleVenta {
  id: number
  producto_id: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  productos: {
    nombre: string
    descripcion?: string
    marca?: string // Added marca field to interface
  }
}

export default function VentaDetallePage() {
  const [venta, setVenta] = useState<VentaDetalle | null>(null)
  const [detalles, setDetalles] = useState<DetalleVenta[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      const id = Array.isArray(params.id) ? params.id[0] : params.id

      // If the id is not a number, redirect to ventas page
      if (isNaN(Number(id)) || id === "nueva") {
        router.push("/admin/ventas")
        return
      }

      fetchVentaDetalle()
    }
  }, [params.id])

  const fetchVentaDetalle = async () => {
    try {
      const id = Array.isArray(params.id) ? params.id[0] : params.id

      if (isNaN(Number(id))) {
        throw new Error("Invalid venta ID")
      }

      // Obtener información de la venta
      const { data: ventaData, error: ventaError } = await supabase
        .from("ventas")
        .select("*")
        .eq("id", Number(id))
        .single()

      if (ventaError) throw ventaError
      setVenta(ventaData)

      // Obtener detalles de la venta con información de productos
      const { data: detallesData, error: detallesError } = await supabase
        .from("detalle_ventas")
        .select(`
          *,
          productos (
            nombre,
            descripcion,
            marca
          )
        `)
        .eq("venta_id", Number(id))

      if (detallesError) throw detallesError
      setDetalles(detallesData || [])
    } catch (error) {
      console.error("Error fetching venta details:", error)
      router.push("/admin/ventas")
    } finally {
      setLoading(false)
    }
  }

  const updateVentaStatus = async (newStatus: string) => {
    if (!venta) return

    setUpdating(true)
    try {
      const { error } = await supabase.from("ventas").update({ estado: newStatus }).eq("id", venta.id)

      if (error) throw error

      // Update local state
      setVenta({ ...venta, estado: newStatus })

      // Show success message (you could add a toast notification here)
      console.log("[v0] Venta status updated successfully")
    } catch (error) {
      console.error("Error updating venta status:", error)
      // Show error message (you could add a toast notification here)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!venta) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Venta no encontrada</h3>
          <p className="text-gray-500 mb-4">La venta que buscas no existe o ha sido eliminada.</p>
          <Button onClick={() => router.push("/admin/ventas")}>Volver a Ventas</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Detalle de Venta #{venta.id}</h1>
        <p className="text-gray-600">Información completa de la venta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información de la venta */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Información General</h2>

            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Fecha</p>
                  <p className="text-sm text-gray-600">
                    {new Date(venta.fecha).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(venta.fecha).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Total</p>
                  <p className="text-lg font-bold text-green-600">${venta.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="h-5 w-5 mr-3 flex items-center justify-center">
                  <div
                    className={`h-3 w-3 rounded-full ${venta.estado === "pagado" ? "bg-green-500" : "bg-yellow-500"}`}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Estado</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      venta.estado === "pagado" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {venta.estado === "pagado" ? "Pagado" : "Reservado"}
                  </span>
                </div>
              </div>

              {venta.estado === "reservado" && (
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => updateVentaStatus("pagado")}
                    disabled={updating}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {updating ? "Actualizando..." : "Marcar como Pagado"}
                  </Button>
                </div>
              )}

              {venta.observaciones && (
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Observaciones</p>
                    <p className="text-sm text-gray-600">{venta.observaciones}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Productos vendidos */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Productos Vendidos</h2>

            {detalles.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No hay productos en esta venta</p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marca
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio Unit.
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {detalles.map((detalle) => (
                      <tr key={detalle.id}>
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{detalle.productos.nombre}</div>
                            {detalle.productos.descripcion && (
                              <div className="text-sm text-gray-500">{detalle.productos.descripcion}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-900">{detalle.productos.marca || "-"}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm text-gray-900">{detalle.cantidad}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm text-gray-900">${detalle.precio_unitario.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-medium text-gray-900">${detalle.subtotal.toFixed(2)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        Total:
                      </td>
                      <td className="px-4 py-3 text-right text-lg font-bold text-green-600">
                        ${venta.total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
