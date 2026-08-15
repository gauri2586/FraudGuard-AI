import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PageHeader } from "@/components/ui/PageHeader"
import { containerVariants, itemVariants } from "@/lib/animations"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToastContainer, ToastProps } from "@/components/ui/Toast"

import { AppearanceSection } from "@/components/settings/AppearanceSection"
import { NotificationsSection } from "@/components/settings/NotificationsSection"
import { SecuritySection } from "@/components/settings/SecuritySection"
import { AIDetectionSection } from "@/components/settings/AIDetectionSection"
import { GeneralSettingsSection } from "@/components/settings/AccountSection"

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(true)
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = (toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setHasChanges(false)
      addToast({
        title: "Settings saved successfully",
        description: "Your preferences have been updated.",
        type: "success",
        onClose: removeToast
      })
    }, 800)
  }

  return (
    <>
      <motion.div 
        className="p-4 md:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto pb-32"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <PageHeader 
          title="Settings" 
          description="Configure your FraudGuard AI workspace, alerts, security and detection preferences."
        />

        <div 
          className="space-y-8" 
          onClickCapture={() => !hasChanges && setHasChanges(true)} 
          onChangeCapture={() => !hasChanges && setHasChanges(true)}
        >
          <motion.div variants={itemVariants}><GeneralSettingsSection /></motion.div>
          <motion.div variants={itemVariants}><NotificationsSection /></motion.div>
          <motion.div variants={itemVariants}><SecuritySection /></motion.div>
          <motion.div variants={itemVariants}><AIDetectionSection /></motion.div>
          <motion.div variants={itemVariants}><AppearanceSection /></motion.div>
        </div>
      </motion.div>

      {/* Sticky Save Bar */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-background/80 backdrop-blur-md z-40 lg:pl-64"
          >
            <div className="max-w-5xl mx-auto flex items-center justify-between md:px-2 lg:px-4">
              <div className="text-sm font-medium text-foreground hidden sm:block">
                You have unsaved changes.
              </div>
              <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto shadow-lg shadow-primary/20 ml-auto">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}
