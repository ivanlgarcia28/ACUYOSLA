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

    const { error: updateError } = await supabase
      .from("turnos")
      .update({
        estado: "reprogramado_paciente",
        observaciones: motivo || "Reprogramado por el paciente",
        modified_at: new Date().toISOString(),
      })
      .eq("id", turnoId)

    if (updateError) {
      console.error("Error updating turno:", updateError)
      return NextResponse.json({ error: "Error al reprogramar el turno" }, { status: 500 })
    }

    const nuevaFechaInicio = new Date(`${nuevaFecha}T${nuevaHora}:00`)
    const nuevaFechaFin = new Date(nuevaFechaInicio.getTime() + 60 * 60 * 1000)

    const { data: nuevoTurno, error: createError } = await supabase
      .from("turnos")
      .insert({
        paciente_dni: pacienteDni,
        tratamiento_id: turno.tratamiento_id,
        calendar_id: turno.calendar_id, // Copy calendar_id from original appointment
        fecha_horario_inicio: nuevaFechaInicio.toISOString(),
        fecha_horario_fin: nuevaFechaFin.toISOString(),
        estado: "reservado",
        observaciones: `Reprogramado desde ${new Date(turno.fecha_horario_inicio).toLocaleDateString()}. ${motivo || ""}`,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating new turno:", createError)
      return NextResponse.json({ error: "Error al crear el nuevo turno" }, { status: 500 })
    }

    // Registrar en historial del turno original
    await supabase.from("turnos_status_history").insert({
      turno_id: turnoId,
      status: "reprogramado_paciente",
      notes: `Reprogramado para ${nuevaFecha} ${nuevaHora}. ${motivo || ""}`,
      changed_at: new Date().toISOString(),
    })

    await supabase.from("turnos_status_history").insert({
      turno_id: nuevoTurno.id,
      status: "reservado",
      notes: `Nuevo turno creado por reprogramación del turno #${turnoId}`,
      changed_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Turno reprogramado exitosamente",
      nuevoTurnoId: nuevoTurno.id,
    })
  } catch (error) {
    console.error("Error rescheduling appointment:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
