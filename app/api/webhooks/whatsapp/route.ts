import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Webhook to handle WhatsApp responses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verify webhook (implement based on your WhatsApp provider)
    const signature = request.headers.get("x-hub-signature-256")
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const supabase = createClient()

    // Process WhatsApp webhook data
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === "messages") {
          for (const message of change.value.messages || []) {
            await processWhatsAppResponse(supabase, message, change.value.contacts[0])
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function processWhatsAppResponse(supabase: any, message: any, contact: any) {
  const phoneNumber = contact.wa_id
  const messageText = message.text?.body?.toLowerCase() || ""

  // Find the most recent pending confirmation for this phone number
  const { data: confirmation } = await supabase
    .from("whatsapp_confirmations")
    .select("id, turno_id")
    .eq("patient_phone", phoneNumber)
    .eq("delivery_status", "sent")
    .eq("response_status", "no_response")
    .order("sent_at", { ascending: false })
    .limit(1)
    .single()

  if (!confirmation) return

  let responseStatus = "no_response"

  // Parse response
  if (messageText.includes("sí") || messageText.includes("si") || messageText.includes("✅")) {
    responseStatus = "confirmed"
  } else if (messageText.includes("no") || messageText.includes("❌") || messageText.includes("cancelar")) {
    responseStatus = "cancelled"
  } else if (messageText.includes("reprogramar") || messageText.includes("📅") || messageText.includes("cambiar")) {
    responseStatus = "rescheduled"
  }

  // Update confirmation status
  await supabase.rpc("update_whatsapp_confirmation_status", {
    p_confirmation_id: confirmation.id,
    p_response_status: responseStatus,
    p_response_content: message.text?.body,
  })
}

function verifyWebhookSignature(body: any, signature: string): boolean {
  // Implement signature verification based on your WhatsApp provider
  // This is a placeholder - implement actual verification
  return true
}

// Verification endpoint for webhook setup
export async function GET(request: NextRequest) {
  try {
    console.log("🔔 [WEBHOOK] WhatsApp webhook GET request received")
    console.log("🔗 [WEBHOOK] Request URL:", request.url)
    console.log("🤖 [WEBHOOK] User-Agent:", request.headers.get("user-agent"))
    console.log("📅 [WEBHOOK] Timestamp:", new Date().toISOString())

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
    console.log("🔑 [WEBHOOK] Environment WHATSAPP_VERIFY_TOKEN exists:", !!verifyToken)
    console.log("🔑 [WEBHOOK] Environment WHATSAPP_VERIFY_TOKEN value:", verifyToken)

    // Parse URL manually to handle edge cases
    const url = new URL(request.url)
    const mode = url.searchParams.get("hub.mode")
    const token = url.searchParams.get("hub.verify_token")
    const challenge = url.searchParams.get("hub.challenge")

    console.log("📋 [WEBHOOK] Webhook verification params:", {
      mode,
      token,
      challenge: challenge ? `${challenge.substring(0, 10)}...` : null,
      expectedToken: verifyToken ? `${verifyToken.substring(0, 5)}...` : null,
      tokenMatch: token === verifyToken,
    })

    if (!verifyToken) {
      console.error("❌ [WEBHOOK] WHATSAPP_VERIFY_TOKEN environment variable not set")
      return NextResponse.json(
        {
          error: "Server configuration error",
          debug: "WHATSAPP_VERIFY_TOKEN not configured",
        },
        { status: 500 },
      )
    }

    if (!mode && !token && !challenge) {
      console.log("ℹ️ [WEBHOOK] Direct access - showing webhook info")
      return NextResponse.json(
        {
          status: "WhatsApp Webhook Active",
          message: "This is a WhatsApp webhook endpoint for Meta Business API",
          instructions: {
            step1: "Use this URL in Meta Developer Console webhook configuration",
            step2: `Set verification token to: ${verifyToken}`,
            step3: "Meta will send verification parameters to validate this endpoint",
          },
          currentUrl: request.url,
          timestamp: new Date().toISOString(),
        },
        { status: 200 },
      )
    }

    if (mode === "subscribe" && token === verifyToken) {
      console.log("✅ [WEBHOOK] Webhook verification successful - returning challenge")
      console.log("🎯 [WEBHOOK] Challenge returned:", challenge)
      return new Response(challenge, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      })
    }

    console.log("❌ [WEBHOOK] Webhook verification failed")
    console.log("🔍 [WEBHOOK] Mode check:", mode === "subscribe")
    console.log("🔍 [WEBHOOK] Token check:", token === verifyToken)

    return NextResponse.json(
      {
        error: "Webhook Verification Failed",
        debug: {
          receivedMode: mode,
          expectedMode: "subscribe",
          receivedToken: token ? `${token.substring(0, 5)}...` : null,
          expectedToken: verifyToken ? `${verifyToken.substring(0, 5)}...` : null,
          tokenMatch: token === verifyToken,
          help: "Make sure the verification token in Meta matches your environment variable",
        },
      },
      { status: 403 },
    )
  } catch (error) {
    console.error("💥 [WEBHOOK] WhatsApp webhook GET error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
