/*
"use client"

import type React from "react"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  clientSecret: string
  amount: number
  appointmentData: any
  onSuccess: () => void
  onError: (error: string) => void
}

function PaymentForm({ clientSecret, amount, appointmentData, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    console.log("[v0] Confirming payment with client secret:", clientSecret.substring(0, 20) + "...")

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/paciente/dashboard?payment=success`,
      },
      redirect: "if_required",
    })

    if (error) {
      console.error("[v0] Payment error:", error)
      onError(error.message || "Error procesando el pago")
    } else if (paymentIntent) {
      console.log("[v0] Payment confirmed successfully")

      try {
        const supabase = createClient()

        let appointmentStatus = "reservado" // Default for processing payments

        if (paymentIntent.status === "succeeded") {
          appointmentStatus = "confirmado"
        } else if (paymentIntent.status === "processing") {
          appointmentStatus = "reservado"
        } else if (paymentIntent.status === "canceled" || paymentIntent.status === "payment_failed") {
          // Don't create appointment for failed/canceled payments
          onError("El pago fue cancelado. No se creó el turno.")
          setIsLoading(false)
          return
        }

        // Create the appointment with the appropriate status
        const { data: newAppointment, error: appointmentError } = await supabase
          .from("turnos")
          .insert({
            paciente_dni: appointmentData.paciente_dni,
            tratamiento_id: appointmentData.tratamiento_id,
            fecha_horario_inicio: appointmentData.fecha_horario_inicio,
            fecha_horario_fin: appointmentData.fecha_horario_fin,
            estado: appointmentStatus,
            observaciones: appointmentData.observaciones,
            calendar_id: appointmentData.calendar_id,
            payment_status: paymentIntent.status === "succeeded" ? "succeeded" : "processing",
            payment_intent_id: paymentIntent.id,
            deposit_required: appointmentData.deposit_required,
            deposit_amount: appointmentData.deposit_amount,
            payment_amount: paymentIntent.amount / 100,
          })
          .select()
          .single()

        if (appointmentError) {
          console.error("[v0] Error creating appointment:", appointmentError)
          onError("Error creando el turno. Contacte al consultorio.")
          setIsLoading(false)
          return
        }

        console.log("[v0] Appointment created successfully:", newAppointment)
        onSuccess()
      } catch (appointmentError) {
        console.error("[v0] Error in appointment creation:", appointmentError)
        onError("Error creando el turno. Contacte al consultorio.")
      }
    }

    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Seña para Confirmar Turno</CardTitle>
        <p className="text-sm text-muted-foreground">Monto: ${amount.toLocaleString("es-AR")} ARS</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          <Button type="submit" disabled={!stripe || isLoading} className="w-full">
            {isLoading ? "Procesando..." : `Pagar Seña $${amount.toLocaleString("es-AR")}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

interface StripePaymentFormProps {
  amount: number
  appointmentData: any
  onSuccess: () => void
  onError: (error: string) => void
}

export default function StripePaymentForm({ amount, appointmentData, onSuccess, onError }: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isCreatingIntent, setIsCreatingIntent] = useState(false)

  const createPaymentIntent = async () => {
    setIsCreatingIntent(true)
    try {
      console.log("[v0] Publishable Key starts with:", process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 7))
      console.log("[v0] Creating payment intent for amount:", amount)

      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          metadata: {
            type: "appointment_deposit",
            patient_dni: appointmentData.patient_dni,
            appointment_date: appointmentData.fecha,
            appointment_time: appointmentData.hora,
          },
        }),
      })

      const data = await response.json()

      if (data.error) {
        console.error("[v0] Error from API:", data.error)
        onError(data.error)
        return
      }

      console.log("[v0] Payment intent created, client secret received")
      setClientSecret(data.clientSecret)
    } catch (error) {
      console.error("[v0] Error creating payment intent:", error)
      onError("Error creando intención de pago")
    }
    setIsCreatingIntent(false)
  }

  if (!clientSecret) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <Button onClick={createPaymentIntent} disabled={isCreatingIntent} className="w-full">
            {isCreatingIntent ? "Preparando pago..." : "Proceder al Pago"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm
        clientSecret={clientSecret}
        amount={amount}
        appointmentData={appointmentData}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
}
*/

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface StripePaymentFormProps {
  amount: number
  appointmentData: any
  onSuccess: () => void
  onError: (error: string) => void
}

export default function StripePaymentForm({ amount, appointmentData, onSuccess, onError }: StripePaymentFormProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <p className="text-center text-muted-foreground mb-4">Funcionalidad de pagos temporalmente deshabilitada</p>
        <Button onClick={onSuccess} className="w-full">
          Continuar sin Pago
        </Button>
      </CardContent>
    </Card>
  )
}
