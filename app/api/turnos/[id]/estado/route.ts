import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/turnos/[id]/estado - Change appointment status
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { estado, motivo, usuario_id } = await request.json()

    if (!estado) {
      return NextResponse.json({ error: "Estado es requerido" }, { status: 400 })
    }

    const validStates = [
      "reservado",
      "confirmado_solicitado",
      "confirmado",
      "reprogramado",
      "cancelado_paciente",
      "cancelado_consultorio",
      "completado",
      "ausente_justificado",
      "ausente_injustificado",
    ]

    if (!validStates.includes(estado)) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 })
    }

    const supabase = createClient()

    // Use the database function to change status with history tracking
    const { error } = await supabase.rpc("cambiar_estado_turno", {
      p_turno_id: Number.parseInt(params.id),
      p_estado_nuevo: estado,
      p_usuario_id: usuario_id || null,
      p_motivo: motivo || null,
    })

    if (error) {
      console.error("Error changing turno status:", error)
      return NextResponse.json({ error: "Error al cambiar el estado del turno" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Estado cambiado a ${estado} exitosamente`,
    })
  } catch (error) {
    console.error("Error changing appointment status:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
