"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, LinkIcon, FileText, Download, Trash2, Plus, Upload } from "lucide-react"
import { createClient } from "@/lib/client"

export default function PacienteArchivosPage() {
  const params = useParams()
  const router = useRouter()
  const dni = params.dni as string
  const supabase = createClient()

  const [paciente, setPaciente] = useState<any>(null)
  const [archivos, setArchivos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo: "link",
    url: "",
    categoria: "",
    fecha_estudio: "",
  })

  const categorias = [
    "Radiografía",
    "Tomografía",
    "Ecografía",
    "Análisis de sangre",
    "Estudio periodontal",
    "Fotografía clínica",
    "Otro",
  ]

  useEffect(() => {
    if (dni) {
      fetchPaciente()
      fetchArchivos()
    }
  }, [dni])

  const fetchPaciente = async () => {
    try {
      const { data, error } = await supabase.from("pacientes").select("dni, nombre_apellido").eq("dni", dni).single()

      if (error) {
        console.error("Error fetching paciente:", error)
        return
      }

      setPaciente(data)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const fetchArchivos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("paciente_archivos")
        .select("*")
        .eq("paciente_dni", dni)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching archivos:", error)
        setArchivos([])
      } else {
        setArchivos(data || [])
      }
    } catch (error) {
      console.error("Error:", error)
      setArchivos([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFormData({ ...formData, nombre: file.name.split(".")[0] })
    }
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploading(true)
      const fileExt = file.name.split(".").pop()
      const fileName = `${dni}_${Date.now()}.${fileExt}`
      const filePath = `pacientes/${dni}/${fileName}`

      const { data, error } = await supabase.storage.from("paciente-archivos").upload(filePath, file)

      if (error) {
        console.error("Error uploading file:", error)
        return null
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("paciente-archivos").getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error("Error:", error)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let fileUrl = formData.url

      if (formData.tipo === "archivo" && selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile)
        if (!uploadedUrl) {
          alert("Error al subir el archivo")
          return
        }
        fileUrl = uploadedUrl
      }

      const { error } = await supabase.from("paciente_archivos").insert({
        paciente_dni: dni,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        url: fileUrl,
        categoria: formData.categoria,
        fecha_estudio: formData.fecha_estudio || null,
      })

      if (error) {
        console.error("Error creating archivo:", error)
        return
      }

      setFormData({
        nombre: "",
        descripcion: "",
        tipo: "link",
        url: "",
        categoria: "",
        fecha_estudio: "",
      })
      setSelectedFile(null)

      setIsDialogOpen(false)
      fetchArchivos()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este archivo?")) return

    try {
      const { error } = await supabase.from("paciente_archivos").delete().eq("id", id)

      if (error) {
        console.error("Error deleting archivo:", error)
        return
      }

      fetchArchivos()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      Radiografía: "bg-blue-100 text-blue-800",
      Tomografía: "bg-purple-100 text-purple-800",
      Ecografía: "bg-green-100 text-green-800",
      "Análisis de sangre": "bg-red-100 text-red-800",
      "Estudio periodontal": "bg-orange-100 text-orange-800",
      "Fotografía clínica": "bg-pink-100 text-pink-800",
      Otro: "bg-gray-100 text-gray-800",
    }
    return colors[categoria] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Cargando archivos del paciente...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Archivos del Paciente</h1>
          <p className="text-gray-600">
            {paciente?.nombre_apellido} - DNI: {dni}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Estudios y Documentos ({archivos.length})</h2>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Agregar Archivo/Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Archivo o Link</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link/URL</SelectItem>
                    <SelectItem value="archivo">Subir Archivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo === "link" ? (
                <div>
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="file">Seleccionar Archivo *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                      required
                      className="flex-1"
                    />
                    {selectedFile && (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <Upload className="h-4 w-4" />
                        {selectedFile.name}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Formatos permitidos: PDF, JPG, PNG, DOC, XLS (máx. 10MB)</p>
                </div>
              )}

              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fecha_estudio">Fecha del Estudio</Label>
                <Input
                  id="fecha_estudio"
                  type="date"
                  value={formData.fecha_estudio}
                  onChange={(e) => setFormData({ ...formData, fecha_estudio: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={uploading}>
                  {uploading ? "Subiendo..." : "Guardar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {archivos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No hay archivos registrados para este paciente</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Agregar Primer Archivo</Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {archivos.map((archivo) => (
            <Card key={archivo.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {archivo.tipo === "link" ? (
                        <LinkIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-green-600" />
                      )}
                      <h3 className="font-semibold">{archivo.nombre}</h3>
                      {archivo.categoria && (
                        <Badge className={getCategoriaColor(archivo.categoria)}>{archivo.categoria}</Badge>
                      )}
                    </div>

                    {archivo.descripcion && <p className="text-gray-600 text-sm mb-2">{archivo.descripcion}</p>}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {archivo.fecha_estudio && (
                        <span>Fecha: {new Date(archivo.fecha_estudio).toLocaleDateString()}</span>
                      )}
                      <span>Agregado: {new Date(archivo.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(archivo.url, "_blank")}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      {archivo.tipo === "link" ? "Abrir" : "Descargar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(archivo.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
