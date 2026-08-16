import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, ShieldAlert, AlertTriangle, AlertOctagon, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { GlassCard } from "@/components/ui/GlassCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs } from "@/components/ui/Tabs"
import { RiskBadge, RiskLevel } from "@/components/ui/RiskBadge"
import { StatusBadge, StatusType } from "@/components/ui/StatusBadge"
import { AlertDrawer } from "@/components/alerts/AlertDrawer"
import { FraudAlert, AlertSeverity } from "@/data/mockAlerts"
import { getAlerts } from "@/services/api"
import { containerVariants, itemVariants } from "@/lib/animations"
import { cn } from "@/lib/utils"

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [severityTab, setSeverityTab] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getAlerts()
      
      // Map backend AlertResponse to frontend FraudAlert
      const mapped: FraudAlert[] = data.map((alert: any) => ({
        id: `ALT-${alert.alert_id}`,
        transactionId: alert.transaction_id,
        user: alert.user,
        amount: alert.amount,
        riskScore: alert.risk_score,
        fraudProbability: alert.fraud_probability,
        severity: alert.severity.toLowerCase() as AlertSeverity,
        status: alert.status.toLowerCase() as StatusType,
        time: alert.timestamp,
        reasons: [alert.reason],
        modelsFlagged: ["XGBoost", "Isolation Forest"],
        location: alert.location,
        device: alert.device
      }))
      
      setAlerts(mapped)
    } catch (error) {
      console.error("Failed to load alerts", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpdateStatus = (id: string, newStatus: StatusType) => {
    // Optimistically update the UI. In a real app, we'd also call a PUT endpoint here.
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    if (selectedAlert?.id === id) {
      setSelectedAlert(prev => prev ? { ...prev, status: newStatus } : null)
    }
  }

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchSearch = 
        alert.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        alert.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchSeverity = severityTab === "all" || alert.severity === severityTab
      const matchStatus = statusFilter === "all" || alert.status === statusFilter

      return matchSearch && matchSeverity && matchStatus
    })
  }, [alerts, searchTerm, severityTab, statusFilter])

  const openDrawer = (alert: FraudAlert) => {
    setSelectedAlert(alert)
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
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Fraud Alerts Inbox" 
          description="Monitor and triage real-time intelligence alerts."
        />
        <Button onClick={loadData} disabled={isLoading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Toolbar */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <Tabs 
          tabs={[
            { id: "all", label: "All Alerts" },
            { id: "critical", label: "Critical" },
            { id: "high", label: "High" },
            { id: "medium", label: "Medium" }
          ]}
          activeTab={severityTab}
          onChange={setSeverityTab}
        />
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <div className="relative flex-1 sm:w-auto w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search ID or User..." 
              className="pl-9 bg-background/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="flex h-10 w-[140px] items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="investigating">Investigating</option>
            <option value="confirmed_fraud">Confirmed</option>
            <option value="false_positive">False Positive</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </motion.div>

      {/* Alert List */}
      <motion.div variants={containerVariants} className="space-y-3">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="py-20 text-center text-muted-foreground bg-card rounded-xl border border-border/50"
            >
              <RefreshCw className="h-10 w-10 mx-auto mb-4 opacity-50 animate-spin" />
              <p>Loading live alerts...</p>
            </motion.div>
          ) : filteredAlerts.length > 0 ? filteredAlerts.map((alert) => (
            <motion.div
              layout
              key={alert.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0 }}
            >
              <GlassCard 
                interactive
                onClick={() => openDrawer(alert)}
                className={cn(
                  "p-4 flex flex-col md:flex-row gap-4 md:items-center cursor-pointer border-l-4 transition-all duration-300",
                  alert.status === "new" ? "bg-secondary/10 hover:bg-secondary/20" : "bg-card/50",
                  alert.severity === "critical" && alert.status === "new" ? "border-l-destructive shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse" : 
                  alert.severity === "critical" ? "border-l-destructive" :
                  alert.severity === "high" ? "border-l-orange-500" : "border-l-warning",
                )}
              >
                {/* Icon & ID */}
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className={`p-2 rounded-full shrink-0 ${alert.severity === 'critical' ? 'bg-destructive/20 text-destructive' : alert.severity === 'high' ? 'bg-orange-500/20 text-orange-500' : 'bg-warning/20 text-warning'}`}>
                    {alert.severity === 'critical' ? <AlertOctagon className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="font-semibold">{alert.id}</div>
                    <div className="text-xs text-muted-foreground">{alert.time}</div>
                  </div>
                </div>

                {/* Main Details */}
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                  <div>
                    <span className="text-xs text-muted-foreground block">User</span>
                    <span className="font-medium text-sm truncate block">{alert.user}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Amount</span>
                    <span className="font-medium text-sm">₹{alert.amount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Risk Score</span>
                    <RiskBadge level={getRiskLevel(alert.riskScore)} />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Status</span>
                    <StatusBadge status={alert.status} />
                  </div>
                </div>

                {/* Primary Reason Truncated */}
                <div className="hidden lg:block w-[250px]">
                  <span className="text-xs text-muted-foreground block">Primary Flag</span>
                  <span className="text-sm truncate block text-foreground/80">{alert.reasons[0]}</span>
                </div>
              </GlassCard>
            </motion.div>
          )) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="py-20 text-center text-muted-foreground bg-card rounded-xl border border-border/50"
            >
              <ShieldAlert className="h-10 w-10 mx-auto mb-4 opacity-50" />
              <p>No alerts found matching your criteria.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AlertDrawer 
        alert={selectedAlert}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdateStatus={handleUpdateStatus}
      />
    </motion.div>
  )
}
