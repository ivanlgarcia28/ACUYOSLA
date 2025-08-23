import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumbers, message, delayBetweenMessages = 1000 } = await request.json()

    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json({ error: "Phone numbers array is required" }, { status: 400 })
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        {
          error: "WhatsApp credentials not configured",
          missing: {
            accessToken: !accessToken,
            phoneNumberId: !phoneNumberId,
          },
        },
        { status: 500 },
      )
    }

    const results = []

    for (let i = 0; i < phoneNumbers.length; i++) {
      const phoneNumber = phoneNumbers[i]

      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "text",
            text: {
              body: message,
            },
          }),
        })

        const result = await response.json()

        results.push({
          phoneNumber,
          success: response.ok,
          messageId: result.messages?.[0]?.id || null,
          error: response.ok ? null : result.error?.message || "Unknown error",
        })

        console.log(
          `[v0] WhatsApp bulk message ${i + 1}/${phoneNumbers.length} to ${phoneNumber}: ${response.ok ? "Success" : "Failed"}`,
        )

        if (i < phoneNumbers.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenMessages))
        }
      } catch (error) {
        results.push({
          phoneNumber,
          success: false,
          messageId: null,
          error: error instanceof Error ? error.message : "Network error",
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.length - successCount

    return NextResponse.json({
      success: true,
      summary: {
        total: phoneNumbers.length,
        successful: successCount,
        failed: failureCount,
      },
      results,
    })
  } catch (error) {
    console.error("[v0] Bulk WhatsApp error:", error)
    return NextResponse.json(
      {
        error: "Failed to send bulk messages",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
