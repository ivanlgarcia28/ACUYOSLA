import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// This API route will be called by Vercel Cron Jobs every hour
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    // Get pending confirmations to send
    const { data: pendingConfirmations, error } = await supabase.rpc("get_pending_confirmations", {
      p_canal: "whatsapp",
    })

    if (error) {
      console.error("Error fetching pending confirmations:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    const results = []

    for (const confirmation of pendingConfirmations || []) {
      try {
        // Send WhatsApp message (you'll need to implement this with your WhatsApp provider)
        const messageResult = await sendWhatsAppMessage(confirmation.destinatario, confirmation.contenido)

        if (messageResult.success) {
          // Update confirmation status to sent
          await supabase.rpc("update_confirmation_status", {
            p_confirmation_id: confirmation.confirmation_id,
            p_delivery_status: "sent",
            p_external_message_id: messageResult.messageId,
          })

          results.push({
            confirmationId: confirmation.confirmation_id,
            patientName: confirmation.patient_name,
            status: "sent",
          })
        } else {
          // Update confirmation status to failed
          await supabase.rpc("update_confirmation_status", {
            p_confirmation_id: confirmation.confirmation_id,
            p_delivery_status: "failed",
            p_metadata: { error: messageResult.error },
          })

          results.push({
            confirmationId: confirmation.confirmation_id,
            patientName: confirmation.patient_name,
            status: "failed",
            error: messageResult.error,
          })
        }
      } catch (error) {
        console.error(`Error sending confirmation to ${confirmation.patient_name}:`, error)
        results.push({
          confirmationId: confirmation.confirmation_id,
          patientName: confirmation.patient_name,
          status: "error",
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// WhatsApp message sending function (implement with your provider)
async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    // Meta WhatsApp Business API implementation
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!phoneNumberId) {
      throw new Error("WHATSAPP_PHONE_NUMBER_ID environment variable is required")
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          body: message,
        },
      }),
    })

    const result = await response.json()

    if (response.ok) {
      return {
        success: true,
        messageId: result.messages[0].id,
      }
    } else {
      return {
        success: false,
        error: result.error?.message || "Failed to send message",
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}
