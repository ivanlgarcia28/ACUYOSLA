import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/turnos - List appointments with advanced filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")
    const pacienteDni = searchParams.get("paciente_dni")
    const fechaInicio = searchParams.get("fecha_inicio")
    const fechaFin = searchParams.get("fecha_fin")
    const tratamientoId = searchParams.get("tratamiento_id")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const supabase = createClient()

    let query = supabase.from("vista_turnos_completa").select("*").order("fecha_horario_inicio", { ascending: true })

    // Apply filters
    if (estado) query = query.eq("estado", estado)
    if (pacienteDni) query = query.eq("paciente_dni", pacienteDni)
    if (tratamientoId) query = query.eq("tratamiento_id", Number.parseInt(tratamientoId))
    if (fechaInicio) query = query.gte("fecha_horario_inicio", fechaInicio)
    if (fechaFin) query = query.lte("fecha_horario_inicio", fechaFin)

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: turnos, error, count } = await query

    if (error) {
      console.error("Error fetching turnos:", error)
      return NextResponse.json({ error: "Error al obtener turnos" }, { status: 500 })
    }

    return NextResponse.json({
      turnos,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error in turnos GET:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST /api/turnos - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const {
      paciente_dni,
      tratamiento_id,
      calendar_id,
      fecha_horario_inicio,
      fecha_horario_fin,
      observaciones,
      monto_total,
    } = await request.json()

    if (!paciente_dni || !fecha_horario_inicio || !fecha_horario_fin) {
      return NextResponse.json(
        {
          error: "Paciente DNI, fecha de inicio y fin son requeridos",
        },
        { status: 400 },
      )
    }

    const supabase = createClient()

    // Check for appointment conflicts
    const { data: conflicts } = await supabase
      .from("turnos")
      .select("id")
      .or(
        `and(fecha_horario_inicio.lte.${fecha_horario_inicio},fecha_horario_fin.gt.${fecha_horario_inicio}),and(fecha_horario_inicio.lt.${fecha_horario_fin},fecha_horario_fin.gte.${fecha_horario_fin})`,
      )
      .not("estado", "in", "(cancelado_paciente,cancelado_consultorio)")

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        {
          error: "Ya existe un turno en ese horario",
        },
        { status: 409 },
      )
    }

    // Create appointment
    const { data: turno, error: turnoError } = await supabase
      .from("turnos")
      .insert({
        paciente_dni,
        tratamiento_id,
        calendar_id,
        fecha_horario_inicio,
        fecha_horario_fin,
        observaciones,
        estado: "reservado",
      })
      .select()
      .single()

    if (turnoError) {
      console.error("Error creating turno:", turnoError)
      return NextResponse.json({ error: "Error al crear el turno" }, { status: 500 })
    }

    // Create payment record if amount specified
    if (monto_total && monto_total > 0) {
      await supabase.from("turnos_pagos").insert({
        turno_id: turno.id,
        monto_total,
        estado_pago: "pendiente",
      })
    }

    // Create history record
    await supabase.from("turnos_historial").insert({
      turno_id: turno.id,
      estado_nuevo: "reservado",
      motivo: "Turno creado",
    })

    return NextResponse.json({
      success: true,
      turno,
      message: "Turno creado exitosamente",
    })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
