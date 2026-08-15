import { Settings, Globe, LogOut } from "lucide-react"
import { SettingsSection, SettingsRow, SettingSelect } from "./SharedComponents"
import { Button } from "../ui/button"

export function GeneralSettingsSection() {
  const handleSignOut = () => {
    if (confirm("Are you sure you want to sign out? (Demo)")) {
      console.log("Signed out")
    }
  }

  return (
    <SettingsSection title="General Settings" icon={Settings} description="Manage your basic workspace and application settings.">
      <SettingsRow title="Language" description="Select your preferred application language.">
        <SettingSelect 
          value="en" 
          onChange={() => {}} 
          options={[
            {label: "English", value: "en"}, 
            {label: "Hindi", value: "hi"}
          ]} 
        />
      </SettingsRow>
      <SettingsRow title="Timezone" description="Set your local timezone for transaction timestamps.">
        <SettingSelect 
          value="ist" 
          onChange={() => {}} 
          options={[
            {label: "India Standard Time (IST)", value: "ist"}, 
            {label: "UTC", value: "utc"}
          ]} 
        />
      </SettingsRow>
      <SettingsRow title="Sign Out" description="End your current session on this device." destructive>
        <Button variant="outline" size="sm" onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SettingsRow>
    </SettingsSection>
  )
}
