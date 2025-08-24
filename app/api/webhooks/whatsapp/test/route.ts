import { NextResponse } from "next/server"

export async function GET() {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

  return NextResponse.json({
    status: "WhatsApp webhook test endpoint",
    timestamp: new Date().toISOString(),
    environment: {
      verifyTokenExists: !!verifyToken,
      verifyTokenLength: verifyToken?.length || 0,
      verifyTokenPreview: verifyToken ? `${verifyToken.substring(0, 10)}...` : null,
    },
    webhookUrl: "/api/webhooks/whatsapp",
    testInstructions:
      "Use this endpoint to verify your webhook configuration before setting up Meta WhatsApp Business API",
  })
}
