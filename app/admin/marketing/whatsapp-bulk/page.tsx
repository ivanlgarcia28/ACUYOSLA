"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function WhatsAppBulkPage() {
  const [phoneNumbers, setPhoneNumbers] = useState("")
  const [message, setMessage] = useState("")
  const [delayBetweenMessages, setDelayBetweenMessages] = useState(1000)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleSendBulk = async () => {
    if (!phoneNumbers.trim() || !message.trim()) {
      alert("Por favor complete todos los campos")
      return
    }

    const numbersArray = phoneNumbers
      .split("\n")
      .map((num) => num.trim())
      .filter((num) => num.length > 0)
      .map((num) => (num.startsWith("+") ? num : `+54${num}`)) // Add Argentina prefix if missing

    if (numbersArray.length === 0) {
      alert("Por favor ingrese al menos un número de teléfono")
      return
    }

    setIsLoading(true)
    setResults(null)

    try {
      const response = await fetch("/api/send-bulk-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumbers: numbersArray,
          message,
          delayBetweenMessages,
        }),
      })

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("Error sending bulk messages:", error)
      alert("Error al enviar mensajes masivos")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mensajes Masivos WhatsApp</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enviar Mensaje Masivo</CardTitle>
          <CardDescription>Envía mensajes de WhatsApp a múltiples números. Un número por línea.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="phoneNumbers">Números de Teléfono</Label>
            <Textarea
              id="phoneNumbers"
              placeholder="5491123456789&#10;5491198765432&#10;5491155555555"
              value={phoneNumbers}
              onChange={(e) => setPhoneNumbers(e.target.value)}
              rows={6}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Un número por línea. Formato: 5491123456789 o +5491123456789
            </p>
          </div>

          <div>
            <Label htmlFor="message">Mensaje</Label>
            <Textarea
              id="message"
              placeholder="Hola! Este es un mensaje desde Ele Odontología..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="delay">Retraso entre mensajes (ms)</Label>
            <Input
              id="delay"
              type="number"
              value={delayBetweenMessages}
              onChange={(e) => setDelayBetweenMessages(Number(e.target.value))}
              min={500}
              max={5000}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Recomendado: 1000ms (1 segundo) para evitar límites de velocidad
            </p>
          </div>

          <Button onClick={handleSendBulk} disabled={isLoading} className="w-full">
            {isLoading ? "Enviando..." : "Enviar Mensajes Masivos"}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados del Envío</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.summary?.total || 0}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.summary?.successful || 0}</div>
                <div className="text-sm text-muted-foreground">Exitosos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.summary?.failed || 0}</div>
                <div className="text-sm text-muted-foreground">Fallidos</div>
              </div>
            </div>

            {results.results && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.results.map((result: any, index: number) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm ${
                      result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                    }`}
                  >
                    <span className="font-medium">{result.phoneNumber}</span>
                    {result.success ? (
                      <span className="ml-2">✓ Enviado (ID: {result.messageId})</span>
                    ) : (
                      <span className="ml-2">✗ Error: {result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
