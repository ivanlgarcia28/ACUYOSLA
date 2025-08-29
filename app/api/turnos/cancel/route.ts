import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { turnoId, pacienteDni, motivo } = await request.json()

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
      p_estado_nuevo: "cancelado_paciente",
      p_motivo: motivo || "Cancelado por el paciente",
    })

    if (error) {
      console.error("Error canceling turno:", error)
      return NextResponse.json({ error: "Error al cancelar el turno" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Turno cancelado exitosamente",
    })
  } catch (error) {
    console.error("Error canceling appointment:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
