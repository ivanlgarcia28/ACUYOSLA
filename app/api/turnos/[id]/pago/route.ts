import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/turnos/[id]/pago - Register payment
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { monto_pagado, metodo_pago, observaciones } = await request.json()

    if (!monto_pagado || monto_pagado <= 0) {
      return NextResponse.json({ error: "Monto de pago es requerido" }, { status: 400 })
    }

    const supabase = createClient()

    // Get or create payment record
    const { data: existingPago } = await supabase.from("turnos_pagos").select("*").eq("turno_id", params.id).single()

    if (existingPago) {
      // Update existing payment
      const nuevoMontoPagado = existingPago.monto_pagado + monto_pagado
      const nuevoEstado = nuevoMontoPagado >= existingPago.monto_total ? "pagado" : "parcial"

      const { error: updateError } = await supabase
        .from("turnos_pagos")
        .update({
          monto_pagado: nuevoMontoPagado,
          estado_pago: nuevoEstado,
          metodo_pago,
          fecha_pago: new Date().toISOString(),
          observaciones: observaciones || existingPago.observaciones,
        })
        .eq("turno_id", params.id)

      if (updateError) {
        console.error("Error updating payment:", updateError)
        return NextResponse.json({ error: "Error al actualizar el pago" }, { status: 500 })
      }
    } else {
      // Create new payment record
      const { error: createError } = await supabase.from("turnos_pagos").insert({
        turno_id: Number.parseInt(params.id),
        monto_total: monto_pagado,
        monto_pagado,
        estado_pago: "pagado",
        metodo_pago,
        fecha_pago: new Date().toISOString(),
        observaciones,
      })

      if (createError) {
        console.error("Error creating payment:", createError)
        return NextResponse.json({ error: "Error al registrar el pago" }, { status: 500 })
      }
    }

    // Add history record
    await supabase.from("turnos_historial").insert({
      turno_id: Number.parseInt(params.id),
      estado_nuevo: "pago_registrado",
      motivo: `Pago registrado: $${monto_pagado} via ${metodo_pago}`,
    })

    return NextResponse.json({
      success: true,
      message: "Pago registrado exitosamente",
    })
  } catch (error) {
    console.error("Error registering payment:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
