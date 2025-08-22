import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: obrasSociales, error } = await supabase
      .from("obras_sociales")
      .select("id, nombre, activa")
      .eq("activa", true)
      .order("nombre")

    if (error) {
      console.error("Error fetching obras sociales:", error)
      // Return fallback data if database query fails
      return NextResponse.json([{ id: 1, nombre: "Particular", activa: true }])
    }

    // Ensure "Particular" is always first
    const particular = obrasSociales.find((obra) => obra.nombre.toLowerCase().includes("particular"))
    const others = obrasSociales.filter((obra) => !obra.nombre.toLowerCase().includes("particular"))

    const sortedObras = particular ? [particular, ...others] : obrasSociales

    return NextResponse.json(sortedObras)
  } catch (error) {
    console.error("API error:", error)
    // Return fallback data on any error
    return NextResponse.json([{ id: 1, nombre: "Particular", activa: true }])
  }
}
