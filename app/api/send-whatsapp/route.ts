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

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    // Send WhatsApp message
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(textMessage),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

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
        console.log("🚨 WHATSAPP ACCESS TOKEN PERMISSION ERROR:")
        console.log("❌ Your current access token doesn't have permission to use phone number:", phoneNumberId)
        console.log("")
        console.log("✅ STEP-BY-STEP SOLUTION:")
        console.log("1. Open Meta Business Manager (business.facebook.com)")
        console.log("2. Navigate to: Usuarios → Usuarios del sistema")
        console.log("3. Click 'Agregar' to create a new System User")
        console.log("4. Name it 'WhatsApp API User' and set role to 'Admin'")
        console.log("5. Click 'Generar nuevo token' and select these permissions:")
        console.log("   ✓ whatsapp_business_messaging")
        console.log("   ✓ whatsapp_business_management")
        console.log("   ✓ business_management")
        console.log("6. Assign your WhatsApp Business Account to this System User")
        console.log("7. Copy the generated token and update WHATSAPP_ACCESS_TOKEN environment variable in Vercel")
        console.log("8. Redeploy your application")
        console.log("")
        console.log("📋 Your WhatsApp Business Account ID: 220889711286590")
        console.log("📱 Your Phone Number ID: 753292091204130")

        return NextResponse.json(
          {
            success: false,
            error: "WhatsApp access token permissions insufficient",
            message:
              "Appointment created successfully, but WhatsApp notification failed due to access token permissions",
            solution: {
              step1: "Go to Meta Business Manager → System Users",
              step2: "Create System User with Admin role",
              step3:
                "Generate token with whatsapp_business_messaging, whatsapp_business_management, business_management permissions",
              step4: "Assign WhatsApp Business Account (220889711286590) to System User",
              step5: "Update WHATSAPP_ACCESS_TOKEN environment variable in Vercel",
              phoneNumberId: phoneNumberId,
              businessAccountId: "220889711286590",
            },
            debug: {
              phoneNumberId,
              formattedPhone: phoneNumber,
              errorCode: result.error?.code,
              errorMessage: result.error?.message,
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

    if (error.name === "AbortError") {
      console.log("⏰ WhatsApp API request timed out after 10 seconds")
      return NextResponse.json(
        {
          success: false,
          error: "WhatsApp API timeout",
          message: "Appointment created successfully, but WhatsApp notification timed out",
        },
        { status: 200 },
      )
    }

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
