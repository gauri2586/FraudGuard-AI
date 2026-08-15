import { useState } from "react"
import { Database, Trash2 } from "lucide-react"
import { SettingsSection, SettingsRow, SettingSelect, SettingToggle } from "./SharedComponents"
import { Button } from "../ui/button"

export function DataPrivacySection() {
  const [retention, setRetention] = useState("90")
  const [analytics, setAnalytics] = useState(true)
  const [anonymous, setAnonymous] = useState(true)

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all local preferences? This cannot be undone.")) {
      console.log("Local preferences cleared")
    }
  }

  return (
    <SettingsSection title="Data & Privacy" icon={Database} description="Manage your data retention and privacy preferences.">
      <SettingsRow title="Data retention" description="How long to keep historical transaction data.">
        <SettingSelect 
          value={retention} 
          onChange={setRetention} 
          options={[
            {label: "30 days", value: "30"}, 
            {label: "90 days", value: "90"}, 
            {label: "1 year", value: "365"}
          ]} 
        />
      </SettingsRow>
      <SettingsRow title="Analytics collection" description="Help us improve by sending crash reports and usage data.">
        <SettingToggle checked={analytics} onChange={setAnalytics} />
      </SettingsRow>
      <SettingsRow title="Anonymous usage statistics" description="Allow sharing of anonymous interaction metrics.">
        <SettingToggle checked={anonymous} onChange={setAnonymous} />
      </SettingsRow>
      <SettingsRow title="Export my data" description="Download a copy of all your account data as JSON.">
        <Button variant="outline" size="sm">Export Data</Button>
      </SettingsRow>
      
      <div className="py-2 sm:px-6 px-4 bg-destructive/5 text-xs font-semibold text-destructive uppercase tracking-wider -mx-4 sm:-mx-6 my-2 border-y border-destructive/20">Danger Zone</div>
      <SettingsRow title="Clear local preferences" description="Reset all settings to default values." destructive>
        <Button variant="destructive" size="sm" onClick={handleClearData}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Data
        </Button>
      </SettingsRow>
    </SettingsSection>
  )
}
