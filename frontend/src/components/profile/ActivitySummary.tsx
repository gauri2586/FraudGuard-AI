import { FileSearch, ShieldAlert, CheckCircle, Clock } from "lucide-react"
import { StatCard } from "../ui/StatCard"

export function ActivitySummary() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Investigations"
        value={1248}
        icon={<FileSearch className="h-5 w-5" />}
        trend={12}
      />
      <StatCard
        title="Alerts Reviewed"
        value={3842}
        icon={<ShieldAlert className="h-5 w-5" />}
        trend={5}
      />
      <StatCard
        title="False Positives"
        value={156}
        icon={<CheckCircle className="h-5 w-5" />}
        trend={-2}
        trendLabel="vs last month"
      />
      <StatCard
        title="Avg. Resolve Time"
        value={14}
        suffix="m"
        icon={<Clock className="h-5 w-5" />}
        trend={-8}
        trendLabel="efficiency"
      />
    </div>
  )
}
