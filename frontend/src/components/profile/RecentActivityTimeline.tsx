import { ShieldAlert, ShieldCheck, FileSearch, UserCog } from "lucide-react"
import { GlassCard } from "../ui/GlassCard"

export function RecentActivityTimeline() {
  const activities = [
    {
      id: 1,
      title: "Reviewed high-risk transaction",
      desc: "Transaction TX-100452 marked as Critical",
      time: "2 hours ago",
      icon: ShieldAlert,
      color: "text-destructive",
      bg: "bg-destructive/10"
    },
    {
      id: 2,
      title: "Marked transaction as legitimate",
      desc: "Transaction TX-100453 reviewed and approved",
      time: "4 hours ago",
      icon: ShieldCheck,
      color: "text-success",
      bg: "bg-success/10"
    },
    {
      id: 3,
      title: "Investigated fraud alert",
      desc: "Alert ALT-892 resolved as false positive",
      time: "Yesterday, 3:45 PM",
      icon: FileSearch,
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      id: 4,
      title: "Updated profile",
      desc: "Changed notification preferences",
      time: "Oct 24, 2023",
      icon: UserCog,
      color: "text-muted-foreground",
      bg: "bg-secondary/20"
    }
  ]

  return (
    <GlassCard className="p-6">
      <h2 className="text-lg font-semibold tracking-tight mb-6">Recent Activity</h2>
      
      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border/50 before:to-transparent">
        {activities.map((activity) => (
          <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Icon */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-card ${activity.bg} ${activity.color} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10`}>
              <activity.icon className="w-4 h-4" />
            </div>
            
            {/* Content */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border/50 bg-background/30 shadow-sm transition-colors hover:bg-secondary/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                <h3 className="font-semibold text-sm">{activity.title}</h3>
                <time className="text-xs text-muted-foreground font-medium">{activity.time}</time>
              </div>
              <p className="text-sm text-muted-foreground">{activity.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
