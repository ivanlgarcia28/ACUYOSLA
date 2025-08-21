"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface Categoria {
  id: number
  nombre: string
}

interface Producto {
  id: number
  nombre: string
  descripcion: string
  presentacion: string
  precio: number
  stock: number
  categoria_id: number
}

export default function EditarProductoPage() {
  const router = useRouter()
  const params = useParams()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProducto()
    fetchCategorias()
  }, [])

  const fetchProducto = async () => {
    try {
      const { data, error } = await supabase.from("productos").select("*").eq("id", params.id).single()

      if (error) throw error
      setProducto(data)
    } catch (error) {
      console.error("Error fetching producto:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias_productos")
        .select("id, nombre")
        .order("nombre", { ascending: true })

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error("Error fetching categorias:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!producto) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("productos")
        .update({
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          presentacion: producto.presentacion,
          precio: producto.precio,
          stock: producto.stock,
          categoria_id: producto.categoria_id,
        })
        .eq("id", producto.id)

      if (error) throw error

      router.push("/admin/productos")
    } catch (error) {
      console.error("Error updating producto:", error)
      alert("Error al actualizar el producto")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!producto) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Producto no encontrado</h2>
          <Link href="/admin/productos">
            <Button className="mt-4">Volver a Productos</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href="/admin/productos">
          <Button variant="outline" size="sm" className="mr-4 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Producto</h1>
          <p className="text-gray-600">Modificar información del producto</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="nombre">Nombre del Producto *</Label>
              <Input
                id="nombre"
                value={producto.nombre}
                onChange={(e) => setProducto({ ...producto, nombre: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="presentacion">Presentación *</Label>
              <Input
                id="presentacion"
                value={producto.presentacion}
                onChange={(e) => setProducto({ ...producto, presentacion: e.target.value })}
                placeholder="ej: Caja x 100 unidades"
                required
              />
            </div>

            <div>
              <Label htmlFor="precio">Precio *</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                min="0"
                value={producto.precio}
                onChange={(e) => setProducto({ ...producto, precio: Number.parseFloat(e.target.value) })}
                required
              />
            </div>

            <div>
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={producto.stock}
                onChange={(e) => setProducto({ ...producto, stock: Number.parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="categoria_id">Categoría *</Label>
              <Select
                value={producto.categoria_id.toString()}
                onValueChange={(value) => setProducto({ ...producto, categoria_id: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={producto.descripcion}
                onChange={(e) => setProducto({ ...producto, descripcion: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/admin/productos">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
