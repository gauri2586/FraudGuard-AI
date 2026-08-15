import { User, Edit2, ShieldCheck } from "lucide-react"
import { GlassCard } from "../ui/GlassCard"
import { Button } from "../ui/button"

export function ProfileHeader({ profile, onEditClick }: { profile?: any, onEditClick?: () => void }) {
  // Use profile from props if available, otherwise fallback
  const name = profile?.name || "Alex Morgan"
  const role = profile?.role || "Senior Fraud Analyst"
  const department = profile?.department || "Fraud Intelligence"
  
  // Get initials for avatar
  const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()

  return (
    <GlassCard className="flex flex-col md:flex-row items-center gap-6 p-8 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      
      <div className="relative group">
        <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center text-3xl font-bold border-4 border-background shadow-lg relative z-10">
          {initials}
        </div>
        <div className="absolute inset-0 rounded-full bg-primary/20 scale-[1.15] -z-0 opacity-50" />
      </div>
      
      <div className="flex-1 text-center md:text-left space-y-1 z-10">
        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
        <p className="text-muted-foreground font-medium">{role}</p>
        <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
            {department}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-success font-medium bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            Active
          </div>
        </div>
      </div>
      
      <div className="z-10 mt-4 md:mt-0">
        <Button variant="outline" className="w-full md:w-auto shadow-sm" onClick={onEditClick}>
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>
    </GlassCard>
  )
}
