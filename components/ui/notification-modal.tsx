"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-react"

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  type?: "success" | "error" | "warning" | "info"
  confirmText?: string
}

export function NotificationModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "Aceptar",
}: NotificationModalProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case "error":
        return <XCircle className="h-6 w-6 text-red-600" />
      case "warning":
        return <AlertCircle className="h-6 w-6 text-yellow-600" />
      default:
        return <Info className="h-6 w-6 text-blue-600" />
    }
  }

  const getTitle = () => {
    if (title) return title
    switch (type) {
      case "success":
        return "Éxito"
      case "error":
        return "Error"
      case "warning":
        return "Advertencia"
      default:
        return "Información"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-base">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easy usage
export function useNotification() {
  const [notification, setNotification] = useState<{
    isOpen: boolean
    title?: string
    message: string
    type?: "success" | "error" | "warning" | "info"
  }>({
    isOpen: false,
    message: "",
  })

  const showNotification = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
    title?: string,
  ) => {
    setNotification({
      isOpen: true,
      message,
      type,
      title,
    })
  }

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, isOpen: false }))
  }

  return {
    notification,
    showNotification,
    hideNotification,
  }
}
