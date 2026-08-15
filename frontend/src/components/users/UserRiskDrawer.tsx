import { motion, AnimatePresence } from "framer-motion"
import { X, ShieldAlert, CheckCircle2, User, MapPin, Smartphone, Clock, CreditCard, Activity, AlertTriangle } from "lucide-react"
import { Button } from "../ui/button"
import { RiskBadge, RiskLevel } from "../ui/RiskBadge"
import { UserProfile } from "@/data/mockUsers"
import { RiskTrendChart, TimeOfDayChart, SpendingRadarChart } from "./UserRiskCharts"

interface DrawerProps {
  user: UserProfile | null
  isOpen: boolean
  onClose: () => void
}

export function UserRiskDrawer({ user, isOpen, onClose }: DrawerProps) {
  if (!user) return null

  const getRiskLevel = (score: number): RiskLevel => {
    if (score <= 30) return "low"
    if (score <= 60) return "medium"
    if (score <= 80) return "high"
    return "critical"
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl border-l border-border/50 bg-card shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-border/50 bg-background/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary border border-secondary/30">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    {user.name}
                    {user.status === "blocked" && <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-semibold">Blocked</span>}
                  </h2>
                  <p className="text-sm text-muted-foreground">{user.id} • {user.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
              
              {/* Top Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-border/50 bg-background/30 flex flex-col items-center text-center">
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">AI Risk Score</span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">{user.riskScore}</span>
                    <RiskBadge level={getRiskLevel(user.riskScore)} />
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-background/30 flex flex-col items-center text-center">
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Total Tx</span>
                  <span className="text-2xl font-bold">{user.txCount}</span>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-background/30 flex flex-col items-center text-center">
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Avg Amount</span>
                  <span className="text-2xl font-bold">₹{user.avgAmount.toFixed(2)}</span>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-background/30 flex flex-col items-center text-center">
                  <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Suspicious Tx</span>
                  <span className={`text-2xl font-bold ${user.suspiciousCount > 0 ? 'text-destructive' : 'text-success'}`}>{user.suspiciousCount}</span>
                </div>
              </div>

              {/* Behavior Analysis Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Normal Behavior */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                    <h3 className="text-lg font-semibold text-foreground">Normal Behavioral Pattern</h3>
                  </div>
                  <div className="p-4 rounded-xl border border-success/20 bg-success/5 space-y-3">
                    <ul className="space-y-2">
                      {user.normalBehavior.map((behavior, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-success shrink-0 mt-1.5" />
                          {behavior}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-success/10 mt-3">
                      <div>
                        <span className="text-xs font-medium text-foreground block mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Locations</span>
                        <span className="text-xs text-muted-foreground truncate block">{user.typicalLocations.join(", ")}</span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-foreground block mb-1 flex items-center gap-1"><Smartphone className="h-3 w-3" /> Devices</span>
                        <span className="text-xs text-muted-foreground truncate block">{user.typicalDevices.join(", ")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deviations */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <ShieldAlert className="h-5 w-5" />
                    <h3 className="text-lg font-semibold text-foreground">Detected Deviations</h3>
                  </div>
                  <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 h-full">
                    <ul className="space-y-3">
                      {user.detectedDeviations.map((dev, i) => (
                        <li key={i} className="text-sm text-destructive-foreground/90 flex items-start gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/10">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                          {dev}
                        </li>
                      ))}
                      {user.detectedDeviations.length === 0 && (
                        <div className="text-sm text-muted-foreground italic flex items-center gap-2 h-full justify-center opacity-70">
                          No deviations detected
                        </div>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Risk Trend (7 Days)
                  </h4>
                  <div className="p-3 rounded-xl border border-border/50 bg-background/30">
                    <RiskTrendChart data={user.riskTrend} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-secondary" /> Activity by Hour
                  </h4>
                  <div className="p-3 rounded-xl border border-border/50 bg-background/30">
                    <TimeOfDayChart data={user.timeOfDay} />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-warning" /> Spending Categories
                  </h4>
                  <div className="p-3 rounded-xl border border-border/50 bg-background/30">
                    <SpendingRadarChart data={user.spendingByCategory} />
                  </div>
                </div>
              </div>

            </div>
            
            {/* Action Footer */}
            <div className="p-4 md:p-6 border-t border-border/50 bg-background/50 backdrop-blur-md flex gap-3 justify-end">
              <Button variant="outline">Reset Risk Profile</Button>
              <Button variant="secondary">Request Identity Verification</Button>
              {user.status !== "blocked" && <Button variant="destructive">Block User</Button>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
