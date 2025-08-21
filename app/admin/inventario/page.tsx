"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Package, DollarSign, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

interface Producto {
  id: number
  nombre: string
  marca: string
  color: string
  stock: number
  precio: number
}

interface LoteProducto {
  id: number
  producto_id: number
  fecha_compra: string
  precio_compra: number
  cantidad_comprada: number
  cantidad_disponible: number
  proveedor: string
  numero_factura: string
  observaciones: string
  producto: {
    nombre: string
    marca: string
    color: string
  }
}

export default function InventarioPage() {
  const [lotes, setLotes] = useState<LoteProducto[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    producto_id: "",
    fecha_compra: "",
    precio_compra: "",
    cantidad_comprada: "",
    proveedor: "",
    numero_factura: "",
    observaciones: "",
  })

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchLotes()
    fetchProductos()
  }, [])

  const fetchLotes = async () => {
    try {
      const { data, error } = await supabase
        .from("lotes_productos")
        .select(`
          *,
          producto:productos(nombre, marca, color)
        `)
        .order("fecha_compra", { ascending: false })

      if (error) throw error
      setLotes(data || [])
    } catch (error) {
      console.error("Error fetching lotes:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, marca, color, stock, precio")
        .order("nombre")

      if (error) throw error
      setProductos(data || [])
    } catch (error) {
      console.error("Error fetching productos:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase.from("lotes_productos").insert([
        {
          producto_id: Number.parseInt(formData.producto_id),
          fecha_compra: formData.fecha_compra,
          precio_compra: Number.parseFloat(formData.precio_compra),
          cantidad_comprada: Number.parseInt(formData.cantidad_comprada),
          cantidad_disponible: Number.parseInt(formData.cantidad_comprada),
          proveedor: formData.proveedor,
          numero_factura: formData.numero_factura,
          observaciones: formData.observaciones,
        },
      ])

      if (error) throw error

      // Actualizar stock del producto
      await supabase
        .from("productos")
        .update({
          stock: supabase.sql`stock + ${Number.parseInt(formData.cantidad_comprada)}`,
        })
        .eq("id", Number.parseInt(formData.producto_id))

      setShowModal(false)
      setFormData({
        producto_id: "",
        fecha_compra: "",
        precio_compra: "",
        cantidad_comprada: "",
        proveedor: "",
        numero_factura: "",
        observaciones: "",
      })
      fetchLotes()
      fetchProductos()
    } catch (error) {
      console.error("Error creating lote:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    )
  }

  const totalInversion = lotes.reduce((sum, lote) => sum + lote.precio_compra * lote.cantidad_comprada, 0)
  const totalDisponible = lotes.reduce((sum, lote) => sum + lote.precio_compra * lote.cantidad_disponible, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control de Inventario</h1>
          <p className="text-gray-600">Gestión de lotes y costos de productos</p>
        </div>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Compra</DialogTitle>
              <DialogDescription>Registra un nuevo lote de productos con su costo de compra</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="producto_id">Producto *</Label>
                <Select
                  value={formData.producto_id}
                  onValueChange={(value) => setFormData({ ...formData, producto_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productos.map((producto) => (
                      <SelectItem key={producto.id} value={producto.id.toString()}>
                        {producto.nombre} - {producto.marca} ({producto.color})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fecha_compra">Fecha de Compra *</Label>
                <Input
                  id="fecha_compra"
                  type="date"
                  value={formData.fecha_compra}
                  onChange={(e) => setFormData({ ...formData, fecha_compra: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="precio_compra">Precio de Compra Unitario *</Label>
                <Input
                  id="precio_compra"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.precio_compra}
                  onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="cantidad_comprada">Cantidad Comprada *</Label>
                <Input
                  id="cantidad_comprada"
                  type="number"
                  placeholder="0"
                  value={formData.cantidad_comprada}
                  onChange={(e) => setFormData({ ...formData, cantidad_comprada: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="proveedor">Proveedor</Label>
                <Input
                  id="proveedor"
                  placeholder="Nombre del proveedor"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="numero_factura">Número de Factura</Label>
                <Input
                  id="numero_factura"
                  placeholder="Número de factura"
                  value={formData.numero_factura}
                  onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Observaciones adicionales"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Registrar Compra
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inversión Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInversion)}</div>
            <p className="text-xs text-muted-foreground">En todos los lotes registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Disponible</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDisponible)}</div>
            <p className="text-xs text-muted-foreground">En stock actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lotes Activos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lotes.filter((l) => l.cantidad_disponible > 0).length}</div>
            <p className="text-xs text-muted-foreground">Con stock disponible</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Lotes */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Compras por Lotes</CardTitle>
          <CardDescription>Registro detallado de todas las compras de productos con costos y fechas</CardDescription>
        </CardHeader>
        <CardContent>
          {lotes.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay lotes registrados</h3>
              <p className="text-gray-600 mb-4">
                Registra tu primera compra de productos para comenzar el control de inventario
              </p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primera Compra
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Fecha Compra</TableHead>
                  <TableHead>Precio Compra</TableHead>
                  <TableHead>Cant. Comprada</TableHead>
                  <TableHead>Cant. Disponible</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotes.map((lote) => (
                  <TableRow key={lote.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lote.producto.nombre}</div>
                        <div className="text-sm text-gray-500">
                          {lote.producto.marca} - {lote.producto.color}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(lote.fecha_compra)}</TableCell>
                    <TableCell>{formatCurrency(lote.precio_compra)}</TableCell>
                    <TableCell>{lote.cantidad_comprada}</TableCell>
                    <TableCell>{lote.cantidad_disponible}</TableCell>
                    <TableCell>{lote.proveedor || "-"}</TableCell>
                    <TableCell>
                      {lote.cantidad_disponible > 0 ? (
                        <Badge variant="default">Disponible</Badge>
                      ) : (
                        <Badge variant="secondary">Agotado</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
