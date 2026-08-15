import { useState } from "react"
import { Key, ShieldCheck, Clock, MonitorSmartphone, Lock, Check, X } from "lucide-react"
import { GlassCard } from "../ui/GlassCard"
import { Button } from "../ui/button"

export function SecurityCard() {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")

  const handleSavePassword = () => {
    setIsChangingPassword(false)
    setNewPassword("")
    alert("Password updated successfully!")
  }

  return (
    <GlassCard className="p-6 h-full flex flex-col">
      <h2 className="text-lg font-semibold tracking-tight mb-6">Security Settings</h2>
      
      <div className="space-y-6 flex-1">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Key className="h-4 w-4 text-muted-foreground" />
              Password
            </div>
            {isChangingPassword ? (
              <div className="pl-6 pt-1 flex items-center gap-2">
                <input 
                  type="password" 
                  className="text-sm font-medium bg-background border border-border focus:border-primary outline-none px-2 py-1 rounded w-full max-w-[200px]"
                  placeholder="New password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            ) : (
              <div className="text-xs text-muted-foreground pl-6">••••••••••••</div>
            )}
          </div>
          {isChangingPassword ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setIsChangingPassword(false)}>
                <X className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-success hover:text-success hover:bg-success/10" onClick={handleSavePassword}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>Change</Button>
          )}
        </div>

        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-success" />
              Two-Factor Auth
            </div>
            <div className="text-xs text-success pl-6">Enabled (Authenticator App)</div>
          </div>
          <Button variant="outline" size="sm">Manage</Button>
        </div>

        <div className="flex flex-col space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Recent Activity</div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-1.5 bg-secondary/10 rounded-md">
              <MonitorSmartphone className="h-4 w-4 text-secondary" />
            </div>
            <div>
              <div className="text-sm font-medium">Current Session</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Today, 10:42 AM • Windows PC
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Button variant="secondary" className="w-full mt-6" size="sm">
        <Lock className="h-4 w-4 mr-2" />
        View All Sessions
      </Button>
    </GlassCard>
  )
}
