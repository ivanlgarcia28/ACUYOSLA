import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ele Odontología - Cuidamos tu sonrisa",
  description:
    "Clínica dental en Salta, Argentina. Ofrecemos servicios de odontología general, ortodoncia, blanqueamiento y más. Atención profesional y personalizada.",
  keywords: "odontología, dentista, Salta, Argentina, limpieza dental, ortodoncia, blanqueamiento",
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
