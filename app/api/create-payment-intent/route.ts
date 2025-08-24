import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Stripe Secret Key starts with:", process.env.STRIPE_SECRET_KEY?.substring(0, 7))
    console.log("[v0] Creating payment intent...")

    const { amount, currency = "ars", metadata } = await request.json()

    console.log("[v0] Payment intent data:", { amount, currency, metadata })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        type: "appointment_deposit",
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    console.log("[v0] Payment intent created successfully:", paymentIntent.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("[v0] Error creating payment intent:", error)
    return NextResponse.json({ error: "Error creating payment intent" }, { status: 500 })
  }
}
