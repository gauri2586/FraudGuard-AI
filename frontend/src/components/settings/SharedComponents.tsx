import { ReactNode } from "react"
import { GlassCard } from "../ui/GlassCard"
import { SectionHeader } from "../ui/SectionHeader"
import { cn } from "@/lib/utils"

export function SettingsSection({ title, description, children, icon: Icon }: { title: string, description?: string, children: ReactNode, icon?: any }) {
  return (
    <div className="space-y-4">
      <SectionHeader 
        title={
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-primary" />}
            <span>{title}</span>
          </div>
        }
        description={description} 
      />
      <GlassCard className="p-4 sm:p-6 overflow-hidden">
        <div className="divide-y divide-border/50 -my-4 sm:-my-6">
          {children}
        </div>
      </GlassCard>
    </div>
  )
}

export function SettingsRow({ title, description, children, destructive }: { title: string, description?: string, children: ReactNode, destructive?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 sm:py-6">
      <div className="flex-1 space-y-1">
        <div className={cn("text-sm font-medium", destructive ? "text-destructive" : "text-foreground")}>{title}</div>
        {description && <div className="text-xs text-muted-foreground leading-relaxed break-words">{description}</div>}
      </div>
      <div className="shrink-0 flex items-center gap-3">
        {children}
      </div>
    </div>
  )
}

export function SettingToggle({ checked, onChange, disabled }: { checked: boolean, onChange: (v: boolean) => void, disabled?: boolean }) {
  return (
    <button 
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
    >
      <span className="sr-only">Toggle setting</span>
      <span aria-hidden="true" className={cn(
        "pointer-events-none absolute left-0 inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
        checked ? 'translate-x-4' : 'translate-x-0.5'
      )} />
    </button>
  )
}

export function SettingSelect({ value, options, onChange }: { value: string, options: {label: string, value: string}[], onChange: (v: string) => void }) {
  return (
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

export function SettingSlider({ value, onChange, min = 0, max = 100 }: { value: number, onChange: (v: number) => void, min?: number, max?: number }) {
  return (
    <div className="flex items-center gap-3 w-full sm:w-64">
      <input 
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <span className="text-sm font-medium tabular-nums w-8 text-right">{value}</span>
    </div>
  )
}
