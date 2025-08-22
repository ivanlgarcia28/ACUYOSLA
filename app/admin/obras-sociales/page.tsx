"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Edit, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface ObraSocial {
  id: number
  nombre: string
  activa: boolean
  created_at: string
}

export default function ObrasSocialesPage() {
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchObrasSociales()
  }, [])

  const fetchObrasSociales = async () => {
    try {
      const { data, error } = await supabase.from("obras_sociales").select("*").order("nombre", { ascending: true })

      if (error) throw error
      setObrasSociales(data || [])
    } catch (error) {
      console.error("Error fetching obras sociales:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActiva = async (id: number, activa: boolean) => {
    try {
      const { error } = await supabase.from("obras_sociales").update({ activa: !activa }).eq("id", id)

      if (error) throw error
      fetchObrasSociales()
    } catch (error) {
      console.error("Error updating obra social:", error)
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
          <h1 className="text-2xl font-bold text-gray-900">Obras Sociales</h1>
          <p className="text-gray-600">Gestionar obras sociales del consultorio</p>
        </div>
        <Link href="/admin/obras-sociales/nuevo">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Obra Social
          </Button>
        </Link>
      </div>

      {obrasSociales.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay obras sociales</h3>
          <p className="text-gray-500 mb-4">Comienza agregando la primera obra social</p>
          <Link href="/admin/obras-sociales/nuevo">
            <Button>Agregar Obra Social</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {obrasSociales.map((obra) => (
                <tr key={obra.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{obra.nombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActiva(obra.id, obra.activa)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        obra.activa ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {obra.activa ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(obra.created_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/admin/obras-sociales/${obra.id}/editar`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
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
