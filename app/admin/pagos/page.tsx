"use client"

import PaymentManagement from "@/components/ui/payment-management"

export default function PagosPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
        <p className="text-gray-600">Administra todos los pagos y transacciones del consultorio</p>
      </div>
      <PaymentManagement />
    </div>
  )
}
