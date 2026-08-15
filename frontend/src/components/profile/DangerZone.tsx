import { LogOut, Trash2 } from "lucide-react"
import { GlassCard } from "../ui/GlassCard"
import { Button } from "../ui/button"

export function DangerZone() {
  const handleSignOut = () => {
    if (confirm("Are you sure you want to sign out? (This is a demo)")) {
      console.log("User signed out")
    }
  }

  const handleDelete = () => {
    if (confirm("WARNING: Are you sure you want to delete your account? This action cannot be undone. (This is a demo)")) {
      console.log("Account deletion requested")
    }
  }

  return (
    <GlassCard className="p-6 border-destructive/30 bg-destructive/5 relative overflow-hidden">
      {/* Subtle red tint background */}
      <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent opacity-50 pointer-events-none" />
      
      <div className="relative z-10">
        <h2 className="text-lg font-semibold tracking-tight text-destructive mb-2">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Irreversible and destructive actions for your account. Please proceed with caution.
        </p>
        
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-destructive/20 bg-background/50">
            <div>
              <div className="text-sm font-medium">Sign Out</div>
              <div className="text-xs text-muted-foreground">End your current session across all devices</div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="shrink-0 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-destructive/20 bg-background/50">
            <div>
              <div className="text-sm font-medium text-destructive">Delete Account</div>
              <div className="text-xs text-muted-foreground">Permanently remove your account and data</div>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDelete} className="shrink-0">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
