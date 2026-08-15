import { motion } from "framer-motion"
import { PageHeader } from "@/components/ui/PageHeader"
import { containerVariants, itemVariants } from "@/lib/animations"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { PersonalInfoCard } from "@/components/profile/PersonalInfoCard"
import { SecurityCard } from "@/components/profile/SecurityCard"
import { ActivitySummary } from "@/components/profile/ActivitySummary"
import { RecentActivityTimeline } from "@/components/profile/RecentActivityTimeline"
import { AccountPreferences } from "@/components/profile/AccountPreferences"
import { DangerZone } from "@/components/profile/DangerZone"
import { useState } from "react"
import { ToastContainer, ToastProps } from "@/components/ui/Toast"

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "Alex Morgan",
    email: "alex.morgan@fraudguard.ai",
    department: "Fraud Intelligence",
    role: "Senior Fraud Analyst"
  })

  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = (toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const handleProfileUpdate = (newProfile: any) => {
    setProfile(newProfile)
    addToast({
      title: "Profile Updated",
      description: "Your personal information has been saved.",
      type: "success",
      onClose: removeToast
    })
  }

  const handleEditClick = () => {
    addToast({
      title: "Edit Mode",
      description: "You can edit your personal information below.",
      type: "info",
      onClose: removeToast
    })
  }

  return (
    <motion.div 
      className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <PageHeader 
        title="User Profile" 
        description="Manage your personal information, security settings, and preferences."
      />

      <motion.div variants={itemVariants}>
        <ProfileHeader profile={profile} onEditClick={handleEditClick} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Info & Security) */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6 flex flex-col">
          <div className="flex-1 min-h-[300px]">
            <PersonalInfoCard profile={profile} onUpdate={handleProfileUpdate} />
          </div>
          <div className="flex-1 min-h-[300px]">
            <SecurityCard />
          </div>
        </motion.div>

        {/* Right Column (Activity & Preferences) */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div variants={itemVariants}>
            <ActivitySummary />
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <motion.div variants={itemVariants} className="xl:col-span-1">
              <RecentActivityTimeline />
            </motion.div>
            
            <motion.div variants={itemVariants} className="xl:col-span-1 space-y-6">
              <AccountPreferences />
              <DangerZone />
            </motion.div>
          </div>
        </div>

      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </motion.div>
  )
}
