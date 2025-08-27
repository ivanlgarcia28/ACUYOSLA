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

    // Actualizar estado del turno
    const { error: updateError } = await supabase
      .from("turnos")
      .update({
        estado: "cancelado_paciente",
        observaciones: motivo || "Cancelado por el paciente",
        modified_at: new Date().toISOString(),
      })
      .eq("id", turnoId)

    if (updateError) {
      console.error("Error updating turno:", updateError)
      return NextResponse.json({ error: "Error al cancelar el turno" }, { status: 500 })
    }

    // Registrar en historial
    await supabase.from("turnos_status_history").insert({
      turno_id: turnoId,
      status: "cancelado_paciente",
      notes: motivo || "Cancelado por el paciente",
      changed_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Turno cancelado exitosamente",
    })
  } catch (error) {
    console.error("Error canceling appointment:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
