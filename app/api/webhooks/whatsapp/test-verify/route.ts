import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
    const testChallenge = "test_challenge_12345"

    // Test the webhook verification logic
    const webhookUrl = new URL("/api/webhooks/whatsapp", request.url)
    webhookUrl.searchParams.set("hub.mode", "subscribe")
    webhookUrl.searchParams.set("hub.verify_token", verifyToken || "")
    webhookUrl.searchParams.set("hub.challenge", testChallenge)

    // Make internal request to webhook
    const response = await fetch(webhookUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Meta-WhatsApp-Test",
      },
    })

    const responseText = await response.text()

    return NextResponse.json({
      status: "Webhook Verification Test",
      testUrl: webhookUrl.toString(),
      webhookResponse: {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      },
      environment: {
        verifyTokenExists: !!verifyToken,
        verifyTokenValue: verifyToken,
        currentUrl: request.url,
      },
      expectedResult: testChallenge,
      success: responseText === testChallenge && response.status === 200,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
