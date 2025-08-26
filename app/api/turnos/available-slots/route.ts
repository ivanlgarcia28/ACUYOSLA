export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get("fecha")

    if (!fecha) {
      return Response.json({ error: "Fecha requerida" }, { status: 400 })
    }

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = createClient()

    // Get existing appointments for the selected date
    const { data: existingTurnos, error } = await supabase
      .from("turnos")
      .select("fecha_horario_inicio, fecha_horario_fin")
      .gte("fecha_horario_inicio", `${fecha}T00:00:00`)
      .lt("fecha_horario_inicio", `${fecha}T23:59:59`)
      .neq("estado", "cancelado_paciente")
      .neq("estado", "cancelado_consultorio")

    if (error) {
      console.error("Error fetching existing appointments:", error)
      return Response.json({ error: "Error al obtener turnos existentes" }, { status: 500 })
    }

    // Generate available time slots (9:00 AM to 6:00 PM, 1-hour slots)
    const availableSlots = []
    const startHour = 9
    const endHour = 18

    for (let hour = startHour; hour < endHour; hour++) {
      const timeSlot = `${hour.toString().padStart(2, "0")}:00`
      const slotStart = `${fecha}T${timeSlot}:00`
      const slotEnd = `${fecha}T${(hour + 1).toString().padStart(2, "0")}:00:00`

      // Check if this slot is already taken
      const isOccupied = existingTurnos?.some((turno) => {
        const turnoStart = new Date(turno.fecha_horario_inicio)
        const turnoEnd = new Date(turno.fecha_horario_fin)
        const slotStartDate = new Date(slotStart)
        const slotEndDate = new Date(slotEnd)

        return (
          (slotStartDate >= turnoStart && slotStartDate < turnoEnd) ||
          (slotEndDate > turnoStart && slotEndDate <= turnoEnd) ||
          (slotStartDate <= turnoStart && slotEndDate >= turnoEnd)
        )
      })

      if (!isOccupied) {
        availableSlots.push({
          value: timeSlot,
          label: `${timeSlot} - ${(hour + 1).toString().padStart(2, "0")}:00`,
        })
      }
    }

    return Response.json({ availableSlots })
  } catch (error) {
    console.error("Error in available-slots API:", error)
    return Response.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
