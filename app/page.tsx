"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar,
  Users,
  FileText,
  CreditCard,
  Shield,
  Clock,
  Bluetooth as Tooth,
  Stethoscope,
  Heart,
  Zap,
  Package,
  ShoppingCart,
  Palette,
  ArrowRight,
} from "lucide-react"
import { useEffect, useState } from "react"

type BusinessType = "home" | "odontologia" | "guantes"

export default function LandingPage() {
  const [currentView, setCurrentView] = useState<BusinessType>("home")

  useEffect(() => {
    console.log("[v0] Landing page loaded successfully")
    console.log("[v0] Current URL:", window.location.href)
    console.log("[v0] Current hostname:", window.location.hostname)

    const handleBeforeUnload = () => {
      console.log("[v0] Page is being unloaded - user navigating away")
    }

    const handlePopState = () => {
      console.log("[v0] Browser back/forward navigation detected")
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)

    setTimeout(() => {
      console.log("[v0] Still on landing page after 2 seconds - no automatic redirect")
    }, 2000)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  const scrollToContact = () => {
    const contactSection = document.getElementById("contacto")
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Business Selection Screen
  if (currentView === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Ele Group</span>
            </div>
            <div className="text-sm text-gray-600">
              Powered by <span className="font-semibold text-blue-600">ACUYO SLA</span>
            </div>
          </div>
        </header>

        {/* Business Selection */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Bienvenido a
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 block">
                Ele Group
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Elige el servicio que necesitas. Ofrecemos atención odontológica profesional y productos de calidad para
              el sector salud.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Ele Odontología Card */}
              <Card
                className="p-8 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-500"
                onClick={() => setCurrentView("odontologia")}
              >
                <CardHeader className="text-center">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Tooth className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-blue-600 mb-2">Ele Odontología</CardTitle>
                  <CardDescription className="text-lg">
                    Tu clínica dental de confianza. Agenda citas, consulta tu historial y recibe atención odontológica
                    de calidad.
                  </CardDescription>
                  <div className="flex items-center justify-center mt-4 text-blue-600">
                    <span className="mr-2">Ingresar</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardHeader>
              </Card>

              {/* Ele Guantes Card */}
              <Card
                className="p-8 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-purple-500"
                onClick={() => setCurrentView("guantes")}
              >
                <CardHeader className="text-center">
                  <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-purple-600 mb-2">Ele Guantes</CardTitle>
                  <CardDescription className="text-lg">
                    Productos de calidad para el sector salud. Guantes, insumos médicos y equipamiento profesional.
                  </CardDescription>
                  <div className="flex items-center justify-center mt-4 text-purple-600">
                    <span className="mr-2">Ingresar</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 px-4">
          <div className="container mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">E</span>
              </div>
              <span className="text-lg font-semibold">Ele Group</span>
            </div>
            <p className="text-gray-400 mb-2">© 2025 Ele Group. Todos los derechos reservados.</p>
            <p className="text-gray-500 text-sm">
              Sistema desarrollado por <span className="text-blue-400 font-semibold">ACUYO SLA</span> - Soluciones
              tecnológicas para el sector salud
            </p>
          </div>
        </footer>
      </div>
    )
  }

  // Ele Guantes View
  if (currentView === "guantes") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Ele Guantes</span>
            </div>
            <Button variant="outline" onClick={() => setCurrentView("home")}>
              ← Volver al inicio
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Bienvenido a<span className="text-purple-600 block">Ele Guantes</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Tu proveedor de confianza en productos para el sector salud. Calidad, seguridad y profesionalismo en cada
              producto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                Ver Catálogo
              </Button>
              <Button size="lg" variant="outline" onClick={scrollToContact}>
                Contactar Ventas
              </Button>
            </div>
          </div>
        </section>

        {/* Products Categories */}
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Nuestros Productos</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Shield className="w-10 h-10 text-purple-600 mb-2" />
                  <CardTitle>Guantes de Protección</CardTitle>
                  <CardDescription>
                    Guantes de nitrilo, látex y vinilo para diferentes aplicaciones médicas y de laboratorio.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Package className="w-10 h-10 text-blue-600 mb-2" />
                  <CardTitle>Insumos Médicos</CardTitle>
                  <CardDescription>
                    Mascarillas, batas, gorros y todo el equipamiento de protección personal necesario.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Stethoscope className="w-10 h-10 text-green-600 mb-2" />
                  <CardTitle>Equipamiento</CardTitle>
                  <CardDescription>
                    Instrumentos y equipos médicos de alta calidad para consultorios y clínicas.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Heart className="w-10 h-10 text-red-600 mb-2" />
                  <CardTitle>Productos Odontológicos</CardTitle>
                  <CardDescription>
                    Insumos especializados para consultorios odontológicos y tratamientos dentales.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <ShoppingCart className="w-10 h-10 text-orange-600 mb-2" />
                  <CardTitle>Venta por Mayor</CardTitle>
                  <CardDescription>
                    Precios especiales para compras al por mayor y distribuidores autorizados.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="w-10 h-10 text-indigo-600 mb-2" />
                  <CardTitle>Entrega Rápida</CardTitle>
                  <CardDescription>
                    Servicio de entrega rápida y confiable para mantener tu stock siempre disponible.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Product Showcase */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Productos Destacados</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <Palette className="w-16 h-16 text-white" />
                </div>
                <CardHeader>
                  <CardTitle className="text-blue-600">Guantes Nitrilo Azul</CardTitle>
                  <CardDescription>Sin polvo, alta resistencia, ideales para procedimientos médicos.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <Palette className="w-16 h-16 text-white" />
                </div>
                <CardHeader>
                  <CardTitle className="text-purple-600">Guantes Nitrilo Violeta</CardTitle>
                  <CardDescription>Resistentes a químicos, perfectos para laboratorios y odontología.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Palette className="w-16 h-16 text-white" />
                </div>
                <CardHeader>
                  <CardTitle className="text-green-600">Guantes Látex Verde</CardTitle>
                  <CardDescription>Flexibilidad superior, tacto natural, para cirugías delicadas.</CardDescription>
                </CardHeader>
              </Card>

              <Card className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                  <Palette className="w-16 h-16 text-white" />
                </div>
                <CardHeader>
                  <CardTitle className="text-gray-600">Guantes Vinilo Transparente</CardTitle>
                  <CardDescription>Económicos y versátiles, ideales para uso general y alimentario.</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contacto" className="py-16 px-4 bg-white">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Contáctanos</h2>
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Dirección</h3>
                    <p className="text-gray-600">Caseros 842, Salta, Argentina</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">WhatsApp</h3>
                    <a href="https://wa.me/5493875350665" className="text-green-600 hover:text-green-700">
                      +54 9 3875350657
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.017 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Instagram</h3>
                    <a
                      href="https://instagram.com/ele.odontologia"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-700"
                    >
                      @ele.odontologia
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Facebook</h3>
                    <a
                      href="https://web.facebook.com/profile.php?id=61554219300176"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:text-blue-800"
                    >
                      Ele Odontología
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">TikTok</h3>
                    <a
                      href="https://www.tiktok.com/@ele.odontologia?_t=ZM-8z4zyy46N7Q&_r=1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black hover:text-gray-700"
                    >
                      @ele.odontologia
                    </a>
                  </div>
                </div>
              </div>

              {/* Google Maps */}
              <div className="h-80 rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3622.1234567890123!2d-65.4167!3d-24.7833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sCaseros%20842%2C%20Salta%2C%20Argentina!5e0!3m2!1ses!2sar!4v1234567890123!5m2!1ses!2sar"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de Ele Odontología"
                ></iframe>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-purple-600">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">¿Necesitas productos de calidad?</h2>
            <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
              Contáctanos hoy mismo y descubre por qué somos el proveedor de confianza para profesionales de la salud.
            </p>
            <Button size="lg" variant="secondary">
              Solicitar Cotización
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 px-4">
          <div className="container mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">E</span>
              </div>
              <span className="text-lg font-semibold">Ele Guantes</span>
            </div>
            <p className="text-gray-400 mb-2">© 2025 Ele Guantes. Todos los derechos reservados.</p>
            <p className="text-gray-500 text-sm">
              Sistema desarrollado por <span className="text-blue-400 font-semibold">ACUYO SLA</span> - Soluciones
              tecnológicas para el sector salud
            </p>
          </div>
        </footer>
      </div>
    )
  }

  // Ele Odontología View
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Ele Odontología</span>
          </div>
          <Button variant="outline" onClick={() => setCurrentView("home")}>
            ← Volver al inicio
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Bienvenido a<span className="text-blue-600 block">Ele Odontología</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Tu clínica dental de confianza. Agenda tus citas, consulta tu historial y mantente conectado con nuestros
            servicios odontológicos de calidad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/paciente">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Portal de Pacientes
              </Button>
            </Link>
            <Button size="lg" variant="outline" onClick={scrollToContact}>
              Contactar Clínica
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Nuestros Servicios</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Calendar className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Agenda de Citas</CardTitle>
                <CardDescription>
                  Programa tus citas de manera fácil y recibe recordatorios automáticos.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-10 h-10 text-green-600 mb-2" />
                <CardTitle>Atención Personalizada</CardTitle>
                <CardDescription>
                  Recibe atención odontológica personalizada con profesionales especializados.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="w-10 h-10 text-purple-600 mb-2" />
                <CardTitle>Historial Médico</CardTitle>
                <CardDescription>Consulta tu historial médico y tratamientos desde cualquier lugar.</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="w-10 h-10 text-red-600 mb-2" />
                <CardTitle>Seguridad y Privacidad</CardTitle>
                <CardDescription>
                  Tu información médica está protegida con los más altos estándares de seguridad.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="w-10 h-10 text-indigo-600 mb-2" />
                <CardTitle>Horarios Flexibles</CardTitle>
                <CardDescription>Ofrecemos horarios flexibles para adaptarnos a tu rutina diaria.</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CreditCard className="w-10 h-10 text-orange-600 mb-2" />
                <CardTitle>Planes de Pago</CardTitle>
                <CardDescription>
                  Opciones de pago flexibles y planes de financiamiento para tus tratamientos.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Nuestros Tratamientos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <Tooth className="w-10 h-10 text-blue-600 mb-2" />
                <CardTitle>Limpieza Dental</CardTitle>
                <CardDescription>Limpieza profunda y profilaxis para mantener tu sonrisa saludable.</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Stethoscope className="w-10 h-10 text-green-600 mb-2" />
                <CardTitle>Ortodoncia</CardTitle>
                <CardDescription>
                  Brackets y alineadores invisibles para corregir la posición de tus dientes.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="w-10 h-10 text-red-600 mb-2" />
                <CardTitle>Endodoncia</CardTitle>
                <CardDescription>Tratamiento de conducto para salvar dientes dañados o infectados.</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="w-10 h-10 text-yellow-600 mb-2" />
                <CardTitle>Blanqueamiento</CardTitle>
                <CardDescription>Blanqueamiento dental profesional para una sonrisa más brillante.</CardDescription>
              </CardHeader>
            </Card>
          </div>
          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">¿Necesitas agendar una consulta?</p>
            <Link href="/paciente">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Crear tu turno en el Portal de Pacientes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="contacto" className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Contáctanos</h2>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Dirección</h3>
                  <p className="text-gray-600">Caseros 842, Salta, Argentina</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">WhatsApp</h3>
                  <a href="https://wa.me/5493875350665" className="text-green-600 hover:text-green-700">
                    +54 9 3875350657
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.017 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Instagram</h3>
                  <a
                    href="https://instagram.com/ele.odontologia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-700"
                  >
                    @ele.odontologia
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Facebook</h3>
                  <a
                    href="https://web.facebook.com/profile.php?id=61554219300176"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:text-blue-800"
                  >
                    Ele Odontología
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">TikTok</h3>
                  <a
                    href="https://www.tiktok.com/@ele.odontologia?_t=ZM-8z4zyy46N7Q&_r=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black hover:text-gray-700"
                  >
                    @ele.odontologia
                  </a>
                </div>
              </div>
            </div>

            {/* Google Maps */}
            <div className="h-80 rounded-lg overflow-hidden shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3622.1234567890123!2d-65.4167!3d-24.7833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sCaseros%20842%2C%20Salta%2C%20Argentina!5e0!3m2!1ses!2sar!4v1234567890123!5m2!1ses!2sar"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de Ele Odontología"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">¿Listo para cuidar tu sonrisa?</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Agenda tu cita hoy mismo y descubre por qué somos la clínica dental de confianza en la zona.
          </p>
          <Link href="/paciente">
            <Button size="lg" variant="secondary">
              Agendar Cita
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">E</span>
            </div>
            <span className="text-lg font-semibold">Ele Odontología</span>
          </div>
          <p className="text-gray-400 mb-2">© 2025 Ele Odontología. Todos los derechos reservados.</p>
          <p className="text-gray-500 text-sm">
            Sistema desarrollado por <span className="text-blue-400 font-semibold">ACUYO SLA</span> - Soluciones
            tecnológicas para el sector salud
          </p>
        </div>
      </footer>
    </div>
  )
}
