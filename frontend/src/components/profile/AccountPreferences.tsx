import { useState } from "react"
import { BellRing, ShieldAlert, BarChart3 } from "lucide-react"
import { GlassCard } from "../ui/GlassCard"
import { ToastContainer, ToastProps } from "../ui/Toast"

export function AccountPreferences() {
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [fraudAlerts, setFraudAlerts] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(false)
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = (title: string, description: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, title, description, type: "info", onClose: removeToast }])
    setTimeout(() => {
      removeToast(id)
    }, 4000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean, name: string) => {
    setter(!value)
    addToast("Preference Updated", `${name} has been ${!value ? "enabled" : "disabled"}.`)
  }

  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${checked ? 'bg-primary' : 'bg-muted'}`}
      role="switch"
      aria-checked={checked}
    >
      <span className="sr-only">Toggle setting</span>
      <span aria-hidden="true" className={`pointer-events-none absolute left-0 inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )

  return (
    <>
    <GlassCard className="p-6">
      <h2 className="text-lg font-semibold tracking-tight mb-6">Preferences</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/30 hover:bg-secondary/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-md text-secondary">
              <BellRing className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium">Email Notifications</div>
              <div className="text-xs text-muted-foreground">Receive updates about system status</div>
            </div>
          </div>
          <Toggle checked={emailNotifs} onChange={() => handleToggle(setEmailNotifs, emailNotifs, "Email Notifications")} />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/30 hover:bg-secondary/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-md text-destructive">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium">Fraud Alert Notifications</div>
              <div className="text-xs text-muted-foreground">Immediate alerts for Critical risk scores</div>
            </div>
          </div>
          <Toggle checked={fraudAlerts} onChange={() => handleToggle(setFraudAlerts, fraudAlerts, "Fraud Alert Notifications")} />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/30 hover:bg-secondary/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium">Weekly Analytics Summary</div>
              <div className="text-xs text-muted-foreground">Receive a weekly breakdown of model performance</div>
            </div>
          </div>
          <Toggle checked={weeklySummary} onChange={() => handleToggle(setWeeklySummary, weeklySummary, "Weekly Analytics Summary")} />
        </div>
      </div>
    </GlassCard>
    <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}
