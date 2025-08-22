"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Heart, MessageCircle } from "lucide-react"

interface InstagramPost {
  id: string
  media_url: string
  caption: string
  likes_count: number
  comments_count: number
  permalink: string
}

export default function InstagramCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)

  const placeholderPosts: InstagramPost[] = [
    {
      id: "1",
      media_url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=400&fit=crop&crop=center",
      caption:
        "Nuestro moderno consultorio está equipado con la última tecnología para brindarte el mejor cuidado dental. ✨ #EleOdontologia #DentalCare",
      likes_count: 45,
      comments_count: 8,
      permalink: "https://instagram.com/ele.odontologia",
    },
    {
      id: "2",
      media_url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=400&fit=crop&crop=center",
      caption:
        "La sonrisa de nuestros pacientes es nuestra mayor satisfacción 😊 Gracias por confiar en nosotros. #Sonrisa #Salud",
      likes_count: 62,
      comments_count: 12,
      permalink: "https://instagram.com/ele.odontologia",
    },
    {
      id: "3",
      media_url: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&h=400&fit=crop&crop=center",
      caption:
        "La limpieza dental profesional es clave para mantener una sonrisa saludable. ¡Agenda tu cita! 🦷 #LimpiezaDental #Prevencion",
      likes_count: 38,
      comments_count: 5,
      permalink: "https://instagram.com/ele.odontologia",
    },
    {
      id: "4",
      media_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center",
      caption:
        "Ortodoncia moderna para lograr la sonrisa perfecta. Consulta nuestros planes de tratamiento 📞 #Ortodoncia #Brackets",
      likes_count: 71,
      comments_count: 15,
      permalink: "https://instagram.com/ele.odontologia",
    },
  ]

  useEffect(() => {
    // Simulate API loading
    const loadPosts = async () => {
      setLoading(true)
      // TODO: Replace with real Instagram Graph API call
      // const response = await fetch('/api/instagram-posts')
      // const data = await response.json()
      // setPosts(data.posts)

      // For now, use placeholder data
      setTimeout(() => {
        setPosts(placeholderPosts)
        setLoading(false)
      }, 1000)
    }

    loadPosts()
  }, [])

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % posts.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + posts.length) % posts.length)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-900">Síguenos en Instagram</h3>
        <a
          href="https://instagram.com/ele.odontologia"
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-600 hover:text-pink-700 font-semibold"
        >
          @ele.odontologia
        </a>
      </div>

      <div className="relative overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {posts.map((post) => (
            <div key={post.id} className="w-full flex-shrink-0">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={post.media_url || "/placeholder.svg"}
                    alt="Instagram post"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src =
                        "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=400&fit=crop&crop=center"
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white text-sm line-clamp-3 mb-2">{post.caption}</p>
                    <div className="flex items-center space-x-4 text-white">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{post.likes_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{post.comments_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center space-x-2 mt-4">
        {posts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? "bg-pink-600" : "bg-gray-300"}`}
          />
        ))}
      </div>
    </div>
  )
}
