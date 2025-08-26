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
      return NextResponse.json(
        {
          success: false,
          error: "WhatsApp credentials not configured",
          message: "Appointment created successfully, but WhatsApp notification could not be sent",
        },
        { status: 200 },
      )
    }

    // Format phone number (remove any non-digits and ensure it starts with country code)
    const formattedPhone = to.replace(/\D/g, "")
    const phoneNumber = formattedPhone.startsWith("54") ? formattedPhone : `54${formattedPhone}`

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

    console.log("📤 Sending WhatsApp message to:", phoneNumber)
    console.log("🔗 API URL:", `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`)

    // Send WhatsApp message
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(textMessage),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("❌ WhatsApp API error response:", JSON.stringify(result, null, 2))
      console.log("🔍 Full request details:")
      console.log(`- Status: ${response.status}`)
      console.log(`- Phone Number ID: ${phoneNumberId}`)
      console.log(`- Formatted phone: ${phoneNumber}`)
      console.log(`- Access Token (first 20 chars): ${accessToken.substring(0, 20)}...`)

      if (
        result.error?.message?.includes("Unsupported post request") ||
        result.error?.message?.includes("Object with ID") ||
        result.error?.code === 100
      ) {
        console.log("🚨 ACCESS TOKEN ISSUE DETECTED:")
        console.log("❌ Current token doesn't have permission for this phone number")
        console.log("✅ SOLUTION - Generate System User Token:")
        console.log("1. Go to Meta Business Manager → Usuarios del sistema")
        console.log("2. Create or select a System User")
        console.log("3. Generate Access Token with these permissions:")
        console.log("   - whatsapp_business_messaging")
        console.log("   - whatsapp_business_management")
        console.log("4. Assign WhatsApp Business Account (220889711286590) to this System User")
        console.log("5. Update WHATSAPP_ACCESS_TOKEN in Vercel with the new token")
        console.log("6. Make sure phone number 753292091204130 is verified and approved")

        return NextResponse.json(
          {
            success: false,
            error: "WhatsApp access token issue",
            message:
              "Appointment created successfully, but WhatsApp notification failed due to access token permissions",
            debug: {
              phoneNumberId,
              formattedPhone: phoneNumber,
              errorCode: result.error?.code,
              errorMessage: result.error?.message,
              solution: "Generate System User token in Meta Business Manager with proper permissions",
            },
          },
          { status: 200 }, // Return 200 so appointment booking doesn't fail
        )
      }

      if (result.error?.code === 133010) {
        console.log("WhatsApp account not registered with Cloud API")
        return NextResponse.json(
          {
            success: false,
            error: "WhatsApp account not registered",
            message: "Appointment created successfully, but WhatsApp notification could not be sent",
          },
          { status: 200 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: "WhatsApp message failed",
          message: "Appointment created successfully, but WhatsApp notification could not be sent",
          details: result,
        },
        { status: 200 },
      )
    }

    console.log("✅ WhatsApp message sent successfully:", result)
    return NextResponse.json({ success: true, messageId: result.messages?.[0]?.id })
  } catch (error) {
    console.error("❌ Error sending WhatsApp message:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Appointment created successfully, but WhatsApp notification could not be sent",
      },
      { status: 200 },
    )
  }
}
