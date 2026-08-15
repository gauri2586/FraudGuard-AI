import { useState } from "react"
import { ShieldCheck } from "lucide-react"
import { SettingsSection, SettingsRow, SettingSelect, SettingToggle } from "./SharedComponents"
import { Button } from "../ui/button"

export function SecuritySection() {
  const [timeout, setTimeoutVal] = useState("30")
  const [loginNotifs, setLoginNotifs] = useState(true)

  return (
    <SettingsSection title="Security" icon={ShieldCheck} description="Manage your account security and sessions.">
      <SettingsRow title="Two-factor authentication" description="Add an extra layer of security to your account.">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">Enabled</span>
          <Button variant="outline" size="sm">Manage</Button>
        </div>
      </SettingsRow>
      <SettingsRow title="Session timeout" description="Automatically sign out after inactivity.">
        <SettingSelect 
          value={timeout} 
          onChange={setTimeoutVal} 
          options={[
            {label: "15 minutes", value: "15"}, 
            {label: "30 minutes", value: "30"}, 
            {label: "1 hour", value: "60"}, 
            {label: "4 hours", value: "240"}
          ]} 
        />
      </SettingsRow>
      <SettingsRow title="Login notifications" description="Get notified when someone logs in from a new device.">
        <SettingToggle checked={loginNotifs} onChange={setLoginNotifs} />
      </SettingsRow>
      <SettingsRow title="Active sessions" description="View and manage currently logged-in devices.">
        <Button variant="secondary" size="sm">View Sessions</Button>
      </SettingsRow>
      <SettingsRow title="Password" description="Change your account password.">
        <Button variant="outline" size="sm">Change Password</Button>
      </SettingsRow>
    </SettingsSection>
  )
}
