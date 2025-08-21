import { createClient } from "@/lib/client"

export interface Usuario {
  id: string
  email: string
  nombre_completo: string
  rol: "doctora" | "asistente"
  activo: boolean
}

export interface Permisos {
  [modulo: string]: {
    puede_ver: boolean
    puede_crear: boolean
    puede_editar: boolean
    puede_eliminar: boolean
  }
}

export async function getCurrentUser(): Promise<Usuario | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from("usuarios_sistema")
    .select("*")
    .eq("email", user.email)
    .eq("activo", true)
    .single()

  return usuario
}

export async function getUserPermissions(rol: string): Promise<Permisos> {
  const supabase = createClient()

  const { data: permisos } = await supabase.from("permisos_rol").select("*").eq("rol", rol)

  const permisosMap: Permisos = {}
  permisos?.forEach((permiso) => {
    permisosMap[permiso.modulo] = {
      puede_ver: permiso.puede_ver,
      puede_crear: permiso.puede_crear,
      puede_editar: permiso.puede_editar,
      puede_eliminar: permiso.puede_eliminar,
    }
  })

  return permisosMap
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}
