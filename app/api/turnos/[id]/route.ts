import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/turnos/[id] - Get specific appointment
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    const { data: turno, error } = await supabase.from("vista_turnos_completa").select("*").eq("id", params.id).single()

    if (error || !turno) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ turno })
  } catch (error) {
    console.error("Error fetching turno:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// PUT /api/turnos/[id] - Update appointment
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json()
    const supabase = createClient()

    // Get current appointment
    const { data: currentTurno, error: fetchError } = await supabase
      .from("turnos")
      .select("*")
      .eq("id", params.id)
      .single()

    if (fetchError || !currentTurno) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
    }

    // Update appointment
    const { data: turno, error: updateError } = await supabase
      .from("turnos")
      .update({
        ...updates,
        modified_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating turno:", updateError)
      return NextResponse.json({ error: "Error al actualizar el turno" }, { status: 500 })
    }

    // Create history record for significant changes
    const significantFields = ["estado", "fecha_horario_inicio", "fecha_horario_fin", "tratamiento_id"]
    const changes = []

    for (const field of significantFields) {
      if (updates[field] && updates[field] !== currentTurno[field]) {
        changes.push(`${field}: ${currentTurno[field]} → ${updates[field]}`)
      }
    }

    if (changes.length > 0) {
      await supabase.from("turnos_historial").insert({
        turno_id: Number.parseInt(params.id),
        estado_anterior: currentTurno.estado,
        estado_nuevo: updates.estado || currentTurno.estado,
        motivo: `Actualización: ${changes.join(", ")}`,
      })
    }

    return NextResponse.json({
      success: true,
      turno,
      message: "Turno actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// DELETE /api/turnos/[id] - Cancel appointment
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { motivo } = await request.json()
    const supabase = createClient()

    // Use the database function to change status
    const { error } = await supabase.rpc("cambiar_estado_turno", {
      p_turno_id: Number.parseInt(params.id),
      p_estado_nuevo: "cancelado_consultorio",
      p_motivo: motivo || "Cancelado desde administración",
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
