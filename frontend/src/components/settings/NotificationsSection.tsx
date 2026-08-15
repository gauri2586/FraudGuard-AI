import { useState } from "react"
import { Bell } from "lucide-react"
import { SettingsSection, SettingsRow, SettingToggle } from "./SharedComponents"

export function NotificationsSection() {
  const [critical, setCritical] = useState(true)
  const [highRisk, setHighRisk] = useState(true)
  const [suspicious, setSuspicious] = useState(false)
  const [daily, setDaily] = useState(true)
  const [weekly, setWeekly] = useState(true)
  const [modelPerf, setModelPerf] = useState(false)
  const [system, setSystem] = useState(true)
  const [security, setSecurity] = useState(true)

  return (
    <SettingsSection title="Notifications" icon={Bell} description="Configure how and when you want to be alerted.">
      <div className="py-2 sm:px-6 px-4 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider -mx-4 sm:-mx-6 mb-2 mt-2 first:mt-0 border-b border-border/50">Fraud Alerts</div>
      <SettingsRow title="Critical fraud alerts" description="Immediate notifications for critical risk scores.">
        <SettingToggle checked={critical} onChange={setCritical} />
      </SettingsRow>
      <SettingsRow title="High-risk alerts" description="Alerts for transactions marked as high risk.">
        <SettingToggle checked={highRisk} onChange={setHighRisk} />
      </SettingsRow>
      <SettingsRow title="Suspicious transaction alerts" description="Notifications for moderately suspicious patterns.">
        <SettingToggle checked={suspicious} onChange={setSuspicious} />
      </SettingsRow>

      <div className="py-2 sm:px-6 px-4 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider -mx-4 sm:-mx-6 my-2 border-y border-border/50">Reports</div>
      <SettingsRow title="Daily summary" description="End-of-day digest of fraud activity.">
        <SettingToggle checked={daily} onChange={setDaily} />
      </SettingsRow>
      <SettingsRow title="Weekly analytics report" description="Comprehensive weekly breakdown of trends.">
        <SettingToggle checked={weekly} onChange={setWeekly} />
      </SettingsRow>
      <SettingsRow title="Model performance report" description="Updates on AI detection accuracy and drift.">
        <SettingToggle checked={modelPerf} onChange={setModelPerf} />
      </SettingsRow>

      <div className="py-2 sm:px-6 px-4 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider -mx-4 sm:-mx-6 my-2 border-y border-border/50">System</div>
      <SettingsRow title="System notifications" description="Maintenance and platform updates.">
        <SettingToggle checked={system} onChange={setSystem} />
      </SettingsRow>
      <SettingsRow title="Security notifications" description="Alerts about logins and account changes.">
        <SettingToggle checked={security} onChange={setSecurity} />
      </SettingsRow>
    </SettingsSection>
  )
}
