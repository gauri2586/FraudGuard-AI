import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toastVariants } from "@/lib/animations"
import { cn } from "@/lib/utils"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"

export type ToastType = "success" | "error" | "info"

export interface ToastProps {
  id: string
  title: string
  description?: string
  type?: ToastType
  onClose: (id: string) => void
}

export function Toast({ id, title, description, type = "info", onClose }: ToastProps) {
  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className={cn(
        "pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-6 shadow-lg glass-card max-w-sm",
        {
          "border-success/20 bg-success/10": type === "success",
          "border-destructive/20 bg-destructive/10": type === "error",
          "border-primary/20 bg-primary/10": type === "info",
        }
      )}
    >
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">
          {type === "success" && <CheckCircle2 className="h-5 w-5 text-success" />}
          {type === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
          {type === "info" && <Info className="h-5 w-5 text-primary" />}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium leading-none">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onClose(id)}
        className="absolute right-2 top-2 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

// Simple Toast Container
export function ToastContainer({ toasts, onClose }: { toasts: ToastProps[], onClose: (id: string) => void }) {
  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  )
}
