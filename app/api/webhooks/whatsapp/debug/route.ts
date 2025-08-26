import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 [DEBUG] Webhook debug endpoint accessed")

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
    const testChallenge = "test_challenge_12345"

    // Test the webhook verification logic
    const testUrl = `${request.url.replace("/debug", "")}?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=${testChallenge}`

    console.log("🔗 [DEBUG] Testing webhook URL:", testUrl)

    try {
      const response = await fetch(testUrl)
      const responseText = await response.text()

      console.log("📊 [DEBUG] Webhook test response:", {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      })

      return NextResponse.json({
        status: "Webhook Debug Test",
        testUrl,
        webhookResponse: {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
        },
        environment: {
          verifyTokenExists: !!verifyToken,
          verifyTokenValue: verifyToken,
          currentUrl: request.url.replace("/debug", ""),
        },
        expectedResult: testChallenge,
        success: responseText === testChallenge && response.status === 200,
        instructions: [
          "If success is true, your webhook is working correctly",
          "If success is false, check the environment variables",
          "Meta should be able to verify your webhook with these same parameters",
        ],
      })
    } catch (fetchError) {
      console.error("❌ [DEBUG] Error testing webhook:", fetchError)
      return NextResponse.json(
        {
          error: "Failed to test webhook",
          details: fetchError instanceof Error ? fetchError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("💥 [DEBUG] Debug endpoint error:", error)
    return NextResponse.json(
      {
        error: "Debug endpoint error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
