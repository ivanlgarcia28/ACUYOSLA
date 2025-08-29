import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/turnos/[id]/historial - Get complete appointment history
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    const { data: historial, error } = await supabase
      .from("turnos_historial")
      .select(`
        *,
        usuarios_sistema!inner(nombre_completo, email)
      `)
      .eq("turno_id", params.id)
      .order("fecha_cambio", { ascending: false })

    if (error) {
      console.error("Error fetching turno history:", error)
      return NextResponse.json({ error: "Error al obtener el historial" }, { status: 500 })
    }

    return NextResponse.json({ historial })
  } catch (error) {
    console.error("Error fetching appointment history:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
