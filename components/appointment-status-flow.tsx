"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusFlowProps {
  currentStatus: string
  history?: Array<{
    status: string
    changed_at: string
    notes?: string
  }>
  className?: string
}

const STATUS_FLOW_STEPS = [
  { key: "reservado", label: "Reservado", color: "bg-blue-500" },
  { key: "confirmacion_solicitada", label: "Confirmación Solicitada", color: "bg-yellow-500" },
  { key: "confirmado", label: "Confirmado", color: "bg-green-500" },
  { key: "asistio", label: "Asistió", color: "bg-green-600" },
  { key: "completado", label: "Completado", color: "bg-green-700" },
  { key: "pagado", label: "Pagado (PLUS)", color: "bg-emerald-500" },
]

const ALTERNATIVE_STATUSES = {
  reprogramado: { label: "Reprogramado", color: "bg-orange-500" },
  cancelado: { label: "Cancelado", color: "bg-red-500" },
  no_asistio_justificado: { label: "No Asistió (Justificado)", color: "bg-yellow-600" },
  no_asistio_sin_justificar: { label: "No Asistió (Sin Justificar)", color: "bg-red-600" },
  cancelado_paciente: { label: "Cancelado por Paciente", color: "bg-red-400" },
  cancelado_consultorio: { label: "Cancelado por Consultorio", color: "bg-red-700" },
}

export function AppointmentStatusFlow({ currentStatus, history = [], className }: StatusFlowProps) {
  const getCurrentStepIndex = () => {
    return STATUS_FLOW_STEPS.findIndex((step) => step.key === currentStatus)
  }

  const isAlternativeStatus = () => {
    return currentStatus in ALTERNATIVE_STATUSES
  }

  const currentStepIndex = getCurrentStepIndex()
  const isAlternative = isAlternativeStatus()

  if (isAlternative) {
    const altStatus = ALTERNATIVE_STATUSES[currentStatus as keyof typeof ALTERNATIVE_STATUSES]
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <div className="flex items-center space-x-1">
          <div className={cn("w-3 h-3 rounded-full", altStatus.color)} />
          <Badge variant="secondary" className="text-xs">
            {altStatus.label}
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {STATUS_FLOW_STEPS.map((step, index) => {
        const isCompleted = index < currentStepIndex
        const isCurrent = index === currentStepIndex
        const isPending = index > currentStepIndex

        return (
          <div key={step.key} className="flex items-center">
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                isCompleted && "bg-green-500",
                isCurrent && step.color,
                isPending && "bg-gray-300",
              )}
              title={step.label}
            />
            {index < STATUS_FLOW_STEPS.length - 1 && (
              <div className={cn("w-4 h-0.5 mx-1", isCompleted ? "bg-green-500" : "bg-gray-300")} />
            )}
          </div>
        )
      })}
      <Badge variant={currentStepIndex >= 0 ? "default" : "secondary"} className="ml-2 text-xs">
        {STATUS_FLOW_STEPS[currentStepIndex]?.label || currentStatus}
      </Badge>
    </div>
  )
}

export function AppointmentStatusHistory({
  history,
}: { history: Array<{ status: string; changed_at: string; notes?: string }> }) {
  if (!history.length) return null

  return (
    <div className="mt-2 space-y-1">
      <p className="text-xs font-medium text-gray-600">Historial:</p>
      <div className="space-y-1">
        {history.slice(-3).map((entry, index) => (
          <div key={index} className="flex items-center space-x-2 text-xs text-gray-500">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span>{entry.status}</span>
            <span>•</span>
            <span>{new Date(entry.changed_at).toLocaleDateString()}</span>
            {entry.notes && (
              <>
                <span>•</span>
                <span className="italic">{entry.notes}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
