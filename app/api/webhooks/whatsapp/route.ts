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
    console.log("[v0] WhatsApp webhook GET request received")
    console.log("[v0] Request URL:", request.url)
    console.log("[v0] Request nextUrl:", request.nextUrl)

    if (!request.nextUrl) {
      console.error("[v0] request.nextUrl is undefined")
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get("hub.mode")
    const token = searchParams.get("hub.verify_token")
    const challenge = searchParams.get("hub.challenge")

    console.log("[v0] Webhook verification params:", { mode, token: token ? "***" : null, challenge })

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log("[v0] Webhook verification successful")
      return new Response(challenge)
    }

    console.log("[v0] Webhook verification failed")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  } catch (error) {
    console.error("[v0] WhatsApp webhook GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
