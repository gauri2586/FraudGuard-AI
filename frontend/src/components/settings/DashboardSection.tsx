import { useState } from "react"
import { LayoutDashboard } from "lucide-react"
import { SettingsSection, SettingsRow, SettingSelect, SettingToggle } from "./SharedComponents"

export function DashboardSection() {
  const [timeRange, setTimeRange] = useState("30")
  const [sorting, setSorting] = useState("risk")
  
  const [kpiCards, setKpiCards] = useState(true)
  const [fraudTrend, setFraudTrend] = useState(true)
  const [recentAlerts, setRecentAlerts] = useState(true)
  const [modelHealth, setModelHealth] = useState(true)

  return (
    <SettingsSection title="Dashboard Preferences" icon={LayoutDashboard} description="Customize your default dashboard view.">
      <SettingsRow title="Default time range" description="The default date range for dashboard analytics.">
        <SettingSelect 
          value={timeRange} 
          onChange={setTimeRange} 
          options={[
            {label: "7 days", value: "7"}, 
            {label: "30 days", value: "30"}, 
            {label: "90 days", value: "90"}, 
            {label: "1 year", value: "365"}
          ]} 
        />
      </SettingsRow>
      <SettingsRow title="Default transaction sorting" description="How transactions are sorted by default.">
        <SettingSelect 
          value={sorting} 
          onChange={setSorting} 
          options={[
            {label: "Highest risk", value: "risk"}, 
            {label: "Latest", value: "latest"}, 
            {label: "Highest amount", value: "amount"}
          ]} 
        />
      </SettingsRow>
      
      <div className="py-2 sm:px-6 px-4 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider -mx-4 sm:-mx-6 my-2 border-y border-border/50">Visible Components</div>
      <SettingsRow title="KPI cards" description="Show top-level metrics on the dashboard.">
        <SettingToggle checked={kpiCards} onChange={setKpiCards} />
      </SettingsRow>
      <SettingsRow title="Fraud trend chart" description="Show the historical fraud volume chart.">
        <SettingToggle checked={fraudTrend} onChange={setFraudTrend} />
      </SettingsRow>
      <SettingsRow title="Recent alerts list" description="Show the latest critical alerts feed.">
        <SettingToggle checked={recentAlerts} onChange={setRecentAlerts} />
      </SettingsRow>
      <SettingsRow title="Model health widget" description="Show AI model performance and drift metrics.">
        <SettingToggle checked={modelHealth} onChange={setModelHealth} />
      </SettingsRow>
    </SettingsSection>
  )
}
