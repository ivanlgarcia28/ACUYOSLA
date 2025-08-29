"use client"

import NotificationCenter from "@/components/ui/notification-center"
import { NotificationProvider } from "@/components/ui/notification-modal"

export default function NotificacionesPage() {
  return (
    <NotificationProvider>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Centro de Notificaciones</h1>
          <p className="text-gray-600">Gestiona confirmaciones, recordatorios y comunicaciones con pacientes</p>
        </div>
        <NotificationCenter />
      </div>
    </NotificationProvider>
  )
}
