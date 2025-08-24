"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

interface Producto {
  id: number
  nombre: string
  presentacion: string
  precio: number
  stock: number
}

interface ProductoVenta {
  producto_id: number
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export default function NuevaVentaPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [productosVenta, setProductosVenta] = useState<ProductoVenta[]>([])
  const [formData, setFormData] = useState({
    estado: "reservado",
    observaciones: "",
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    console.log("[v0] Nueva Venta page mounted successfully")
    console.log("[v0] Router object:", router)
    console.log("[v0] Supabase client:", supabase)
    console.log("[v0] Current pathname:", window.location.pathname)
    console.log("[v0] Starting fetchProductos...")

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log("[v0] Page is about to unload/redirect")
    }

    const handlePopState = (e: PopStateEvent) => {
      console.log("[v0] Browser back/forward navigation detected:", e)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)

    fetchProductos()

    return () => {
      console.log("[v0] Nueva Venta page unmounting")
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  const fetchProductos = async () => {
    try {
      console.log("[v0] Fetching productos...")
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, presentacion, precio, stock")
        .gt("stock", 0)
        .order("nombre")

      if (error) {
        console.error("[v0] Error fetching productos:", error)
        if (error.message.includes("permission") || error.message.includes("access")) {
          console.error("[v0] Permission error detected - this might cause redirect")
        }
        throw error
      }
      console.log("[v0] Productos loaded successfully:", data?.length || 0, "items")
      setProductos(data || [])
    } catch (error) {
      console.error("[v0] Error al cargar productos:", error)
      if (error instanceof Error && error.message.includes("permission")) {
        console.error("[v0] Permission denied - staying on page to show error")
        alert("No tienes permisos para acceder a los productos. Contacta al administrador.")
        return
      }
      alert("Error al cargar productos. Por favor, recarga la página.")
    }
  }

  const agregarProducto = () => {
    setProductosVenta([
      ...productosVenta,
      {
        producto_id: 0,
        nombre: "",
        cantidad: 1,
        precio_unitario: 0,
        subtotal: 0,
      },
    ])
  }

  const actualizarProducto = (index: number, campo: string, valor: any) => {
    const nuevosProductos = [...productosVenta]

    if (campo === "producto_id") {
      const producto = productos.find((p) => p.id === Number.parseInt(valor))
      if (producto) {
        nuevosProductos[index].producto_id = producto.id
        nuevosProductos[index].nombre = producto.nombre
        nuevosProductos[index].precio_unitario = producto.precio
        nuevosProductos[index].subtotal = nuevosProductos[index].cantidad * producto.precio
      }
    } else if (campo === "cantidad") {
      nuevosProductos[index].cantidad = Number.parseInt(valor) || 1
      nuevosProductos[index].subtotal = nuevosProductos[index].cantidad * nuevosProductos[index].precio_unitario
    }

    setProductosVenta(nuevosProductos)
  }

  const eliminarProducto = (index: number) => {
    setProductosVenta(productosVenta.filter((_, i) => i !== index))
  }

  const calcularTotal = () => {
    return productosVenta.reduce((total, item) => total + item.subtotal, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] Form submitted with data:", { formData, productosVenta })

    if (productosVenta.length === 0) {
      alert("Debe agregar al menos un producto")
      return
    }

    if (productosVenta.some((p) => p.producto_id === 0)) {
      alert("Debe seleccionar todos los productos")
      return
    }

    setLoading(true)

    try {
      const total = calcularTotal()
      console.log("[v0] Creating venta with total:", total)

      // Crear la venta
      const { data: venta, error: ventaError } = await supabase
        .from("ventas")
        .insert([
          {
            estado: formData.estado,
            total,
            observaciones: formData.observaciones,
          },
        ])
        .select()
        .single()

      if (ventaError) throw ventaError

      console.log("[v0] Venta created successfully:", venta)

      // Crear los detalles de la venta
      const detalles = productosVenta.map((item) => ({
        venta_id: venta.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      }))

      const { error: detalleError } = await supabase.from("detalle_ventas").insert(detalles)

      if (detalleError) throw detalleError

      console.log("[v0] Venta details created successfully")

      // Actualizar stock de productos
      for (const item of productosVenta) {
        const { error: stockError } = await supabase
          .from("productos")
          .update({
            stock: productos.find((p) => p.id === item.producto_id)!.stock - item.cantidad,
          })
          .eq("id", item.producto_id)

        if (stockError) throw stockError
      }

      console.log("[v0] Stock updated successfully, navigating back to ventas")
      router.push("/admin/ventas")
    } catch (error) {
      console.error("[v0] Error creating venta:", error)
      alert("Error al crear la venta")
    } finally {
      setLoading(false)
    }
  }

  const handleVolver = () => {
    console.log("[v0] Volver button clicked - user initiated navigation")
    router.push("/admin/ventas")
  }

  const handleCancelar = () => {
    console.log("[v0] Cancelar button clicked - user initiated navigation")
    router.push("/admin/ventas")
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleVolver} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Venta</h1>
        <p className="text-gray-600">Registrar una nueva venta de productos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="estado">Estado *</Label>
            <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reservado">Reservado</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Productos</h3>
            <Button type="button" onClick={agregarProducto} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
          </div>

          <div className="space-y-4">
            {productosVenta.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                <div>
                  <Label>Producto</Label>
                  <Select
                    value={item.producto_id.toString()}
                    onValueChange={(value) => actualizarProducto(index, "producto_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id.toString()}>
                          {producto.presentacion} (Stock: {producto.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => actualizarProducto(index, "cantidad", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Precio Unit.</Label>
                  <Input type="number" step="0.01" value={item.precio_unitario} readOnly className="bg-gray-50" />
                </div>

                <div>
                  <Label>Subtotal</Label>
                  <Input type="number" step="0.01" value={item.subtotal.toFixed(2)} readOnly className="bg-gray-50" />
                </div>

                <div className="flex items-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => eliminarProducto(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {productosVenta.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-right">
                <span className="text-lg font-bold">Total: ${calcularTotal().toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={handleCancelar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || productosVenta.length === 0}>
            {loading ? "Guardando..." : "Registrar Venta"}
          </Button>
        </div>
      </form>
    </div>
  )
}
