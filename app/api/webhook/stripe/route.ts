import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent

    if (paymentIntent.metadata.type === "appointment_deposit") {
      // Update appointment status to confirmed when payment succeeds
      const { error } = await supabase
        .from("turnos")
        .update({
          estado: "confirmado",
          payment_status: "succeeded",
          payment_amount: paymentIntent.amount / 100,
        })
        .eq("payment_intent_id", paymentIntent.id)

      if (error) {
        console.error("Error updating appointment on payment success:", error)
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent

    if (paymentIntent.metadata.type === "appointment_deposit") {
      // Delete appointment if payment fails
      const { error } = await supabase.from("turnos").delete().eq("payment_intent_id", paymentIntent.id)

      if (error) {
        console.error("Error deleting appointment on payment failure:", error)
      }
    }
  }

  if (event.type === "payment_intent.canceled") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent

    if (paymentIntent.metadata.type === "appointment_deposit") {
      // Delete appointment if payment is canceled
      const { error } = await supabase.from("turnos").delete().eq("payment_intent_id", paymentIntent.id)

      if (error) {
        console.error("Error deleting appointment on payment cancellation:", error)
      }
    }
  }

  return NextResponse.json({ received: true })
}
