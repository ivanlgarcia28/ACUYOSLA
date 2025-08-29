import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { turnoId, pacienteDni } = await request.json()

    if (!turnoId || !pacienteDni) {
      return NextResponse.json({ error: "Turno ID y DNI del paciente son requeridos" }, { status: 400 })
    }

    const supabase = createClient()

    // Verificar que el turno pertenece al paciente
    const { data: turno, error: turnoError } = await supabase
      .from("turnos")
      .select("*")
      .eq("id", turnoId)
      .eq("paciente_dni", pacienteDni)
      .single()

    if (turnoError || !turno) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
    }

    const { error } = await supabase.rpc("cambiar_estado_turno", {
      p_turno_id: turnoId,
      p_estado_nuevo: "confirmado",
      p_motivo: "Confirmado por el paciente",
    })

    if (error) {
      console.error("Error confirming turno:", error)
      return NextResponse.json({ error: "Error al confirmar el turno" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Turno confirmado exitosamente",
    })
  } catch (error) {
    console.error("Error confirming appointment:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
