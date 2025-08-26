import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { turnoId, pacienteDni, nuevaFecha, nuevaHora, motivo } = await request.json()

    if (!turnoId || !pacienteDni || !nuevaFecha || !nuevaHora) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
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

    // Calcular nueva fecha y hora de fin (asumiendo 1 hora de duración)
    const nuevaFechaInicio = new Date(`${nuevaFecha}T${nuevaHora}:00`)
    const nuevaFechaFin = new Date(nuevaFechaInicio.getTime() + 60 * 60 * 1000)

    // Actualizar el turno con nueva fecha y estado
    const { error: updateError } = await supabase
      .from("turnos")
      .update({
        estado: "reprogramado_paciente",
        fecha_horario_inicio: nuevaFechaInicio.toISOString(),
        fecha_horario_fin: nuevaFechaFin.toISOString(),
        observaciones: motivo || "Reprogramado por el paciente",
        modified_at: new Date().toISOString(),
      })
      .eq("id", turnoId)

    if (updateError) {
      console.error("Error updating turno:", updateError)
      return NextResponse.json({ error: "Error al reprogramar el turno" }, { status: 500 })
    }

    // Registrar en historial
    await supabase.from("turnos_status_history").insert({
      turno_id: turnoId,
      status: "reprogramado_paciente",
      notes: `Reprogramado para ${nuevaFecha} ${nuevaHora}. ${motivo || ""}`,
      changed_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Turno reprogramado exitosamente",
    })
  } catch (error) {
    console.error("Error rescheduling appointment:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
