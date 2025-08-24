"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Plus, Edit } from "lucide-react"
import Link from "next/link"

interface Producto {
  id: number
  nombre: string
  descripcion: string
  presentacion: string
  precio: number
  stock: number
  categoria_id: number
  marca?: string
  color?: string
  cantidad_unidades?: number
  created_at: string
  categorias_productos: {
    nombre: string
  }
}

interface CategoriaConProductos {
  id: number
  nombre: string
  productos: Producto[]
}

export default function ProductosPage() {
  const [categorias, setCategorias] = useState<CategoriaConProductos[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProductosPorCategoria()
  }, [])

  const fetchProductosPorCategoria = async () => {
    try {
      console.log("[v0] Fetching productos...")

      const { data: productos, error: productosError } = await supabase
        .from("productos")
        .select(`
          *,
          categorias_productos (
            nombre
          )
        `)
        .order("nombre", { ascending: true })

      if (productosError) {
        console.error("[v0] Error fetching productos:", productosError)
        throw productosError
      }

      console.log("[v0] Productos fetched:", productos?.length || 0, "products")

      const { data: todasCategorias, error: categoriasError } = await supabase
        .from("categorias_productos")
        .select("*")
        .order("nombre", { ascending: true })

      if (categoriasError) {
        console.error("[v0] Error fetching categorias:", categoriasError)
        throw categoriasError
      }

      console.log("[v0] Categorias fetched:", todasCategorias?.length || 0, "categories")

      const categoriasConProductos: CategoriaConProductos[] = todasCategorias.map((categoria) => ({
        id: categoria.id,
        nombre: categoria.nombre,
        productos: productos?.filter((producto) => producto.categoria_id === categoria.id) || [],
      }))

      console.log("[v0] Final categorias with products:", categoriasConProductos)
      setCategorias(categoriasConProductos)
      setError(null)
    } catch (error) {
      console.error("Error fetching productos por categoría:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-6 bg-gray-200 rounded w-1/6 mb-3"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error al cargar productos</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              fetchProductosPorCategoria()
            }}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">Gestión de productos e inventario por categorías</p>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
        {categorias.map((categoria) => (
          <div key={categoria.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
              <h2 className="text-xl font-semibold text-blue-900">{categoria.nombre}</h2>
              <p className="text-sm text-blue-600">{categoria.productos.length} productos</p>
            </div>

            {categoria.productos.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marca
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad de Unidades
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoria.productos.map((producto) => (
                    <tr key={producto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">{producto.descripcion}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.marca || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.color || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {producto.cantidad_unidades ? `${producto.cantidad_unidades} unidades/caja` : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${producto.precio}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            producto.stock > 10
                              ? "bg-green-100 text-green-800"
                              : producto.stock > 0
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {producto.stock} unidades
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/admin/productos/${producto.id}/editar`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No hay productos en esta categoría</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {categorias.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay categorías</h3>
          <p className="mt-1 text-sm text-gray-500">Las categorías se crearán automáticamente al agregar productos.</p>
        </div>
      )}
    </div>
  )
}
