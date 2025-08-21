import Image from "next/image"
import Link from "next/link"
import { Phone, MapPin, MessageCircle, Users, Award, Heart } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/images/ele-odontologia-logo.png"
                alt="Ele Odontología"
                width={48}
                height={48}
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Ele Odontología</h1>
                <p className="text-sm text-gray-600">Cuidamos tu sonrisa</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#servicios" className="text-gray-700 hover:text-blue-600">
                Servicios
              </a>
              <a href="#nosotros" className="text-gray-700 hover:text-blue-600">
                Nosotros
              </a>
              <a href="#contacto" className="text-gray-700 hover:text-blue-600">
                Contacto
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Tu sonrisa es nuestra
              <span className="text-blue-600"> prioridad</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              En Ele Odontología brindamos atención dental integral con la más alta calidad y tecnología de vanguardia
              para cuidar tu salud bucal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/5493875350657"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Reservar Turno
              </a>
              <a
                href="#servicios"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Ver Servicios
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nuestros Servicios</h2>
            <p className="text-lg text-gray-600">Ofrecemos una amplia gama de tratamientos dentales</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Consulta General", desc: "Evaluación completa de tu salud bucal" },
              { title: "Limpieza Dental", desc: "Profilaxis y eliminación de sarro" },
              { title: "Empastes", desc: "Restauración de caries con materiales de calidad" },
              { title: "Extracciones", desc: "Procedimientos seguros y sin dolor" },
              { title: "Ortodoncia", desc: "Corrección de la posición dental" },
              { title: "Blanqueamiento", desc: "Sonrisa más blanca y brillante" },
            ].map((service, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="nosotros" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">¿Por qué elegirnos?</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Award className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Experiencia Profesional</h3>
                    <p className="text-gray-600">Años de experiencia cuidando la salud bucal de nuestros pacientes</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Heart className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Atención Personalizada</h3>
                    <p className="text-gray-600">Cada paciente recibe un tratamiento único y personalizado</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Users className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Equipo Calificado</h3>
                    <p className="text-gray-600">Profesionales altamente capacitados y en constante actualización</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Horarios de Atención</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Lunes a Viernes</span>
                  <span className="font-medium">9:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sábados</span>
                  <span className="font-medium">Cerrado</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Domingos</span>
                  <span className="font-medium">Cerrado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Contacto</h2>
            <p className="text-lg text-gray-600">Estamos aquí para ayudarte</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Phone className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Teléfono</h3>
              <p className="text-gray-600">+54 9 387 535-0657</p>
            </div>
            <div className="text-center">
              <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">WhatsApp</h3>
              <a href="https://wa.me/5493875350657" className="text-green-600 hover:underline">
                Enviar mensaje
              </a>
            </div>
            <div className="text-center">
              <MapPin className="w-8 h-8 text-red-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Ubicación</h3>
              <p className="text-gray-600">Caseros 842, Salta, Argentina</p>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Access */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-8">Acceso a Portales</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Acceso Administrativo
            </Link>
            <Link
              href="/paciente"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Portal de Pacientes
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Image
                src="/images/ele-odontologia-logo.png"
                alt="Ele Odontología"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="font-semibold">Ele Odontología</span>
            </div>
            <p className="text-gray-400 text-sm">© 2025 Ele Odontología. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
