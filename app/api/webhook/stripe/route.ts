import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createClient()

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent

    if (paymentIntent.metadata.type === "appointment_payment") {
      const { error: paymentError } = await supabase
        .from("turnos_pagos")
        .update({
          estado_pago: "pagado",
          monto_pagado: paymentIntent.amount / 100,
          fecha_pago: new Date().toISOString(),
          observaciones: `Pago completado via Stripe - ${paymentIntent.id}`,
        })
        .eq("turno_id", paymentIntent.metadata.turno_id)

      const { error: turnoError } = await supabase
        .from("turnos")
        .update({
          estado: "confirmado_paciente",
        })
        .eq("id", paymentIntent.metadata.turno_id)

      await supabase.from("turnos_historial").insert({
        turno_id: Number.parseInt(paymentIntent.metadata.turno_id),
        estado_anterior: "reservado",
        estado_nuevo: "confirmado_paciente",
        comentario: `Pago completado exitosamente via Stripe`,
        tipo_cambio: "pago",
      })

      if (paymentError || turnoError) {
        console.error("Error updating payment/appointment:", { paymentError, turnoError })
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent

    if (paymentIntent.metadata.type === "appointment_payment") {
      await supabase
        .from("turnos_pagos")
        .update({
          estado_pago: "fallido",
          observaciones: `Pago fallido via Stripe - ${paymentIntent.id}`,
        })
        .eq("turno_id", paymentIntent.metadata.turno_id)

      await supabase.from("turnos_historial").insert({
        turno_id: Number.parseInt(paymentIntent.metadata.turno_id),
        estado_anterior: "reservado",
        estado_nuevo: "pago_fallido",
        comentario: `Pago fallido via Stripe`,
        tipo_cambio: "pago",
      })
    }
  }

  return NextResponse.json({ received: true })
}
