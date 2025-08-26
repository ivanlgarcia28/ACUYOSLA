import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { to, patientName, appointmentDate, appointmentTime } = await request.json()

    // Validate required environment variables
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    console.log("🔍 WhatsApp API Debug Info:")
    console.log(`📱 Phone Number ID: ${phoneNumberId}`)
    console.log(`🔑 Access Token exists: ${!!accessToken}`)
    console.log(`🔑 Access Token length: ${accessToken?.length || 0}`)
    console.log(`📞 Recipient phone: ${to}`)

    if (!accessToken || !phoneNumberId) {
      console.error("❌ Missing WhatsApp credentials")
      return NextResponse.json({ error: "WhatsApp credentials not configured" }, { status: 500 })
    }

    // Format phone number (remove any non-digits and ensure it starts with country code)
    const formattedPhone = to.replace(/\D/g, "")
    const phoneNumber = formattedPhone.startsWith("54") ? formattedPhone : `54${formattedPhone}`

    // Create the message
    const message = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "template",
      template: {
        name: "appointment_confirmation", // You'll need to create this template in Meta Business
        language: {
          code: "es_AR",
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: patientName,
              },
              {
                type: "text",
                text: appointmentDate,
              },
              {
                type: "text",
                text: appointmentTime,
              },
            ],
          },
        ],
      },
    }

    // If template doesn't exist, use text message instead
    const textMessage = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "text",
      text: {
        body: `¡Hola ${patientName}! 😊

Gracias por agendar un turno con Ele Odontología 🦷✨

Te esperamos en Caseros 842, Salta el día ${appointmentDate} a las ${appointmentTime} hs 📅⏰

📍 Dirección: Caseros 842, Salta, Argentina
🕐 Por favor, llegá 10 minutos antes de tu cita

Si necesitás reprogramar o cancelar, contactanos con anticipación 📞

¡Te esperamos! 💙
Ele Odontología`,
      },
    }

    // Send WhatsApp message
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(textMessage), // Use textMessage for now, switch to message when template is ready
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("❌ WhatsApp API error:", result)
      console.log("🔍 Request details:")
      console.log(`- URL: https://graph.facebook.com/v18.0/${phoneNumberId}/messages`)
      console.log(`- Phone Number ID: ${phoneNumberId}`)
      console.log(`- Access Token (first 20 chars): ${accessToken.substring(0, 20)}...`)

      if (result.error?.message?.includes("Object with ID") && result.error?.message?.includes("does not exist")) {
        console.log("🚨 SOLUTION NEEDED:")
        console.log("1. Go to Meta Developer Console → WhatsApp → API Setup")
        console.log("2. Click 'Generar token de acceso' to generate a new access token")
        console.log("3. Make sure the token has permission for phone number:", phoneNumberId)
        console.log("4. Update WHATSAPP_ACCESS_TOKEN in Vercel environment variables")
        console.log("5. Verify the phone number is approved for messaging")

        return NextResponse.json(
          {
            success: false,
            error: "WhatsApp configuration issue",
            message:
              "Appointment created successfully, but WhatsApp notification failed due to access token or permissions",
            debug: {
              phoneNumberId,
              accessTokenLength: accessToken.length,
              issue: "Access token may not have permission for this phone number",
              solution: "Generate new access token in Meta Developer Console",
            },
          },
          { status: 200 },
        )
      }

      if (result.error?.code === 133010 && result.error?.error_subcode === 2593006) {
        console.log(
          "WhatsApp account not registered with Cloud API - appointment will continue without WhatsApp notification",
        )
        return NextResponse.json(
          {
            success: false,
            error: "WhatsApp account not registered",
            message: "Appointment created successfully, but WhatsApp notification could not be sent",
          },
          { status: 200 },
        ) // Return 200 so appointment booking doesn't fail
      }

      return NextResponse.json({ error: "Failed to send WhatsApp message", details: result }, { status: 400 })
    }

    console.log("WhatsApp message sent successfully:", result)
    return NextResponse.json({ success: true, messageId: result.messages?.[0]?.id })
  } catch (error) {
    console.error("Error sending WhatsApp message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
