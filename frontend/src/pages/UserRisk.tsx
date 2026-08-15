import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, User, ShieldAlert, Activity, CreditCard } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { GlassCard } from "@/components/ui/GlassCard"
import { Input } from "@/components/ui/input"
import { RiskBadge, RiskLevel } from "@/components/ui/RiskBadge"
import { UserRiskDrawer } from "@/components/users/UserRiskDrawer"
import { MOCK_USERS, UserProfile } from "@/data/mockUsers"
import { containerVariants, itemVariants } from "@/lib/animations"

export default function UserRiskPage() {
  const [users] = useState<UserProfile[]>(MOCK_USERS)
  const [searchTerm, setSearchTerm] = useState("")
  const [riskFilter, setRiskFilter] = useState("all")
  
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
      
      let matchRisk = true
      if (riskFilter !== "all") {
        const riskLevel = user.riskScore <= 30 ? "low" : user.riskScore <= 60 ? "medium" : user.riskScore <= 80 ? "high" : "critical"
        matchRisk = riskLevel === riskFilter
      }

      return matchSearch && matchRisk
    })
  }, [users, searchTerm, riskFilter])

  const openDrawer = (user: UserProfile) => {
    setSelectedUser(user)
    setDrawerOpen(true)
  }

  const getRiskLevel = (score: number): RiskLevel => {
    if (score <= 30) return "low"
    if (score <= 60) return "medium"
    if (score <= 80) return "high"
    return "critical"
  }

  return (
    <motion.div 
      className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <PageHeader 
        title="User Behavioral Intelligence" 
        description="Analyze behavioral fraud profiles, historical trends, and deviations."
      />

      {/* Toolbar */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by Name, Email, or ID..." 
            className="pl-9 bg-background/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="flex h-10 w-full sm:w-[180px] items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
        >
          <option value="all">All Risk Levels</option>
          <option value="critical">Critical Risk</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>
      </motion.div>

      {/* User Grid */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredUsers.map((user) => (
            <motion.div
              layout
              key={user.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard 
                interactive 
                className="h-full cursor-pointer flex flex-col hover:border-primary/50 transition-colors"
                onClick={() => openDrawer(user)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary border border-secondary/30 shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{user.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <RiskBadge level={getRiskLevel(user.riskScore)} />
                    {user.status === 'blocked' && <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">Blocked</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mt-auto border-t border-border/50 pt-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><CreditCard className="h-3 w-3" /> Total Tx</span>
                    <span className="font-medium">{user.txCount}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3" /> Avg Amount</span>
                    <span className="font-medium">₹{user.avgAmount.toFixed(2)}</span>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShieldAlert className={`h-3 w-3 ${user.suspiciousCount > 0 ? 'text-warning' : ''}`} /> 
                      Suspicious History
                    </span>
                    <span className="font-medium">{user.suspiciousCount} flagged • {user.fraudHistory} confirmed</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
          {filteredUsers.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center text-muted-foreground bg-card rounded-xl border border-border/50"
            >
              <User className="h-10 w-10 mx-auto mb-4 opacity-50" />
              <p>No user profiles found matching your search.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <UserRiskDrawer 
        user={selectedUser}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </motion.div>
  )
}
