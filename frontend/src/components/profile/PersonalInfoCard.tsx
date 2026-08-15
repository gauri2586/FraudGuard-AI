import { useState } from "react"
import { Mail, Briefcase, UserCircle, Edit3, Clock, Check, X } from "lucide-react"
import { GlassCard } from "../ui/GlassCard"
import { Button } from "../ui/button"

export function PersonalInfoCard({ profile: initialProfile, onUpdate }: { profile?: any, onUpdate?: (p: any) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const defaultProfile = {
    name: "Alex Morgan",
    email: "alex.morgan@fraudguard.ai",
    department: "Fraud Intelligence",
    role: "Senior Fraud Analyst"
  }
  
  const profile = initialProfile || defaultProfile
  const [editForm, setEditForm] = useState(profile)

  const handleSave = () => {
    if (onUpdate) onUpdate(editForm)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditForm(profile)
    setIsEditing(false)
  }

  const info = [
    { key: "name", label: "Full Name", value: profile.name, icon: UserCircle },
    { key: "email", label: "Email Address", value: profile.email, icon: Mail },
    { key: "department", label: "Department", value: profile.department, icon: Briefcase },
    { key: "role", label: "Role", value: profile.role, icon: UserCircle },
    { key: "lastLogin", label: "Last Login", value: "Today, 10:42 AM", icon: Clock },
  ]

  return (
    <GlassCard className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold tracking-tight">Personal Information</h2>
        {!isEditing ? (
          <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground" onClick={() => setIsEditing(true)}>
            <Edit3 className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-success hover:text-success hover:bg-success/10" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-6 flex-1">
        {info.map((item, idx) => (
          <div key={idx} className="flex flex-col space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <item.icon className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">{item.label}</span>
            </div>
            {isEditing && item.key !== "lastLogin" ? (
              <input
                type="text"
                className="text-sm font-medium pl-6 bg-transparent border-b border-border focus:border-primary outline-none py-1"
                value={editForm[item.key as keyof typeof editForm]}
                onChange={(e) => setEditForm({ ...editForm, [item.key]: e.target.value })}
              />
            ) : (
              <span className="text-sm font-medium pl-6">{item.value}</span>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
