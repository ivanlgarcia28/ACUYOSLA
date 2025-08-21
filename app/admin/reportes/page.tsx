"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface ProductoVendido {
  producto_id: number
  nombre: string
  categoria: string
  marca: string
  color: string
  presentacion: string
  total_vendido: number
  total_ingresos: number
  veces_vendido: number
}

interface ReporteStats {
  totalProductosVendidos: number
  totalIngresos: number
  productoMasVendido: string
  categoriaMasVendida: string
}

const COLORS = ["#2196F3", "#A5D6A7", "#FF8A65", "#E3F2FD", "#F5F5F5"]

export default function ReportesPage() {
  const [productosVendidos, setProductosVendidos] = useState<ProductoVendido[]>([])
  const [stats, setStats] = useState<ReporteStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroCategoria, setFiltroCategoria] = useState<string>("all")
  const [filtroMarca, setFiltroMarca] = useState<string>("all")
  const [categorias, setCategorias] = useState<any[]>([])
  const [marcas, setMarcas] = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    fetchReportes()
    fetchCategorias()
  }, [filtroCategoria, filtroMarca])

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase.from("categorias_productos").select("*").eq("activa", true)

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error("Error fetching categorias:", error)
    }
  }

  const fetchReportes = async () => {
    try {
      setLoading(true)

      let query = supabase.from("detalle_ventas").select(`
          producto_id,
          cantidad,
          precio_unitario,
          subtotal,
          productos!inner (
            nombre,
            marca,
            color,
            presentacion,
            categoria_id,
            categorias_productos!inner (
              nombre
            )
          )
        `)

      if (filtroCategoria !== "all") {
        query = query.eq("productos.categoria_id", filtroCategoria)
      }

      if (filtroMarca !== "all") {
        query = query.eq("productos.marca", filtroMarca)
      }

      const { data, error } = await query

      if (error) throw error

      // Procesar datos para obtener estadísticas
      const productosMap = new Map<number, ProductoVendido>()
      const marcasSet = new Set<string>()

      data?.forEach((item: any) => {
        const productoId = item.producto_id
        const producto = item.productos
        const categoria = producto.categorias_productos.nombre

        marcasSet.add(producto.marca)

        if (productosMap.has(productoId)) {
          const existing = productosMap.get(productoId)!
          existing.total_vendido += item.cantidad
          existing.total_ingresos += Number(item.subtotal)
          existing.veces_vendido += 1
        } else {
          productosMap.set(productoId, {
            producto_id: productoId,
            nombre: producto.nombre,
            categoria: categoria,
            marca: producto.marca,
            color: producto.color,
            presentacion: producto.presentacion,
            total_vendido: item.cantidad,
            total_ingresos: Number(item.subtotal),
            veces_vendido: 1,
          })
        }
      })

      const productosArray = Array.from(productosMap.values()).sort((a, b) => b.total_vendido - a.total_vendido)

      setProductosVendidos(productosArray)
      setMarcas(Array.from(marcasSet).sort())

      // Calcular estadísticas generales
      const totalProductosVendidos = productosArray.reduce((sum, p) => sum + p.total_vendido, 0)
      const totalIngresos = productosArray.reduce((sum, p) => sum + p.total_ingresos, 0)
      const productoMasVendido = productosArray[0]?.nombre || "N/A"

      const categoriaStats = new Map<string, number>()
      productosArray.forEach((p) => {
        categoriaStats.set(p.categoria, (categoriaStats.get(p.categoria) || 0) + p.total_vendido)
      })
      const categoriaMasVendida = Array.from(categoriaStats.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"

      setStats({
        totalProductosVendidos,
        totalIngresos,
        productoMasVendido,
        categoriaMasVendida,
      })
    } catch (error) {
      console.error("Error fetching reportes:", error)
    } finally {
      setLoading(false)
    }
  }

  const limpiarFiltros = () => {
    setFiltroCategoria("all")
    setFiltroMarca("all")
  }

  // Datos para gráficos
  const topProductos = productosVendidos.slice(0, 10)
  const categoriaData = productosVendidos
    .reduce((acc: any[], producto) => {
      const existing = acc.find((item) => item.categoria === producto.categoria)
      if (existing) {
        existing.total += producto.total_vendido
      } else {
        acc.push({ categoria: producto.categoria, total: producto.total_vendido })
      }
      return acc
    }, [])
    .sort((a, b) => b.total - a.total)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes de Ventas</h1>
          <p className="text-gray-600">Análisis de productos más vendidos</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Marca</label>
              <Select value={filtroMarca} onValueChange={setFiltroMarca}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seleccionar marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las marcas</SelectItem>
                  {marcas.map((marca) => (
                    <SelectItem key={marca} value={marca}>
                      {marca}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={limpiarFiltros} variant="outline">
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas generales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Productos Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalProductosVendidos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.totalIngresos.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Producto Más Vendido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-gray-900 truncate">{stats.productoMasVendido}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Categoría Más Vendida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-gray-900">{stats.categoriaMasVendida}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_vendido" fill="#2196F3" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventas por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoriaData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoria, percent }) => `${categoria} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {categoriaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla detallada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Productos Vendidos</CardTitle>
          <CardDescription>Lista completa de productos ordenados por cantidad vendida</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-700">Producto</th>
                  <th className="text-left p-3 font-medium text-gray-700">Categoría</th>
                  <th className="text-left p-3 font-medium text-gray-700">Marca</th>
                  <th className="text-left p-3 font-medium text-gray-700">Color</th>
                  <th className="text-left p-3 font-medium text-gray-700">Presentación</th>
                  <th className="text-right p-3 font-medium text-gray-700">Cantidad Vendida</th>
                  <th className="text-right p-3 font-medium text-gray-700">Veces Vendido</th>
                  <th className="text-right p-3 font-medium text-gray-700">Total Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {productosVendidos.map((producto, index) => (
                  <tr key={producto.producto_id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{producto.nombre}</td>
                    <td className="p-3 text-gray-600">{producto.categoria}</td>
                    <td className="p-3 text-gray-600">{producto.marca}</td>
                    <td className="p-3 text-gray-600">{producto.color}</td>
                    <td className="p-3 text-gray-600">{producto.presentacion}</td>
                    <td className="p-3 text-right font-semibold text-blue-600">{producto.total_vendido}</td>
                    <td className="p-3 text-right text-gray-600">{producto.veces_vendido}</td>
                    <td className="p-3 text-right font-semibold text-green-600">
                      ${producto.total_ingresos.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {productosVendidos.length === 0 && (
              <div className="text-center py-8 text-gray-500">No hay datos de ventas para mostrar</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
