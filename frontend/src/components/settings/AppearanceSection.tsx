import { useState } from "react"
import { Palette } from "lucide-react"
import { SettingsSection, SettingsRow, SettingSelect, SettingToggle } from "./SharedComponents"
import { useTheme } from "@/components/ThemeProvider"

export function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  const [accent, setAccent] = useState("standard")
  const [animations, setAnimations] = useState("full")
  const [compact, setCompact] = useState(false)

  return (
    <SettingsSection title="Appearance" icon={Palette} description="Customize how FraudGuard AI looks on this device.">
      <SettingsRow title="Theme" description="Select your preferred application theme.">
        <SettingSelect 
          value={theme} 
          onChange={setTheme} 
          options={[{label: "Dark", value: "dark"}, {label: "Light", value: "light"}, {label: "System", value: "system"}]} 
        />
      </SettingsRow>
      <SettingsRow title="Accent Intensity" description="Adjust the brightness of primary accent colors.">
        <SettingSelect 
          value={accent} 
          onChange={setAccent} 
          options={[{label: "Standard", value: "standard"}, {label: "High", value: "high"}]} 
        />
      </SettingsRow>
      <SettingsRow title="Animations" description="Control the level of UI motion and transitions.">
        <SettingSelect 
          value={animations} 
          onChange={setAnimations} 
          options={[{label: "Full", value: "full"}, {label: "Reduced", value: "reduced"}]} 
        />
      </SettingsRow>
      <SettingsRow title="Compact Mode" description="Reduce padding and spacing to show more data.">
        <SettingToggle checked={compact} onChange={setCompact} />
      </SettingsRow>
    </SettingsSection>
  )
}
