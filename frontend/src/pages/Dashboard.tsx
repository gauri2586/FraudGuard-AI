import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { ShieldAlert, CreditCard, Activity, IndianRupee, ArrowRight, ShieldCheck, Zap } from "lucide-react"
import { GlassCard } from "@/components/ui/GlassCard"
import { StatCard } from "@/components/ui/StatCard"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { PageHeader } from "@/components/ui/PageHeader"
import { RiskBadge } from "@/components/ui/RiskBadge"
import { Button } from "@/components/ui/button"
import { TrendChart } from "@/components/charts/TrendChart"
import { VolumeChart } from "@/components/charts/VolumeChart"
import { DistributionChart } from "@/components/charts/DistributionChart"
import type { RiskLevel } from "@/components/ui/RiskBadge"
import { containerVariants, itemVariants } from "@/lib/animations"
import { getDashboardStats, simulateTransaction, getAlerts, checkBackendHealth } from "@/services/api"
import { formatINR } from "@/lib/utils"

export default function Dashboard() {
  const [isSimulating, setIsSimulating] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [health, setHealth] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardStats, alts, hlth] = await Promise.all([
          getDashboardStats(),
          getAlerts(),
          checkBackendHealth()
        ])
        setStats(dashboardStats || null)
        setAlerts(alts || [])
        setHealth(hlth === true)
      } catch (e) {
        console.error("Failed to load dashboard data", e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSimulate = async () => {
    setIsSimulating(true)
    try {
      const mockRiskTx = {
        transaction_id: `TX-SIM-${Math.floor(Math.random() * 10000)}`,
        user_id: "USR-SIM-999",
        amount: 8500.00,
        transaction_type: "Transfer",
        merchant_category: "Crypto",
        location: "Unknown",
        device_type: "API",
        timestamp: new Date().toISOString()
      }
      
      const result = await simulateTransaction(mockRiskTx)
      if (result.model_status === "ERROR") {
        throw new Error(result.message || "Model models offline.")
      }
      alert(`Simulation Complete! Risk Level: ${result.risk_level}\nScore: ${result.risk_score}\nCheck the Simulator page for a deep dive!`)
    } catch (error: any) {
      console.error(error)
      alert(error.message || "Failed to simulate transaction. Is the backend running?")
    } finally {
      setIsSimulating(false)
    }
  }

  const dashboardData = useMemo(() => {
    if (!stats) return null

    const activeAlerts = alerts
      .filter(a => a.status === 'New' || a.status === 'Investigating')
      .slice(0, 5)

    return {
      ...stats,
      activeAlerts
    }
  }, [stats, alerts])

  if (isLoading) {
    return <div className="p-20 text-center text-muted-foreground">Loading AI Dashboard...</div>
  }

  if (!dashboardData) {
    return <div className="p-20 text-center text-muted-foreground">Dashboard waiting for ML inference data...</div>
  }

  return (
    <motion.div 
      className="p-4 md:p-6 lg:p-8 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <PageHeader 
        title="Intelligence Dashboard" 
        description="Real-time monitoring of financial fraud and system metrics."
        actions={
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSimulate} 
              disabled={isSimulating}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Zap className={`mr-2 h-4 w-4 shrink-0 ${isSimulating ? 'animate-pulse text-warning' : ''}`} />
              <span className="whitespace-nowrap">{isSimulating ? "Simulating ML..." : "Run Fraud Simulation"}</span>
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={itemVariants}>
          <StatCard
            title="Total Transactions"
            value={dashboardData.totalTransactions.toLocaleString()}
            icon={<CreditCard className="h-5 w-5" />}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Fraud Detected"
            value={dashboardData.fraudDetected.toLocaleString()}
            icon={<ShieldAlert className="h-5 w-5 text-destructive" />}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Suspicious Activity"
            value={dashboardData.suspicious.toLocaleString()}
            icon={<Activity className="h-5 w-5 text-warning" />}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            title="Money at Risk"
            value={dashboardData.moneyAtRisk.toFixed(2)}
            formatAsINR={true}
            icon={<IndianRupee className="h-5 w-5" />}
          />
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="lg:col-span-2 min-w-0">
          <GlassCard className="h-full">
            <SectionHeader title="Fraud Detection Trends (Demo Data)" description="Flagged transactions over time" />
            <TrendChart data={dashboardData.timeData} />
          </GlassCard>
        </motion.div>
        <motion.div variants={itemVariants} className="min-w-0">
          <GlassCard className="h-full">
            <SectionHeader title="Fraud Distribution (Demo Data)" description="By payment method" />
            <DistributionChart data={dashboardData.distributionData} />
          </GlassCard>
        </motion.div>
      </div>

      {/* Charts & Tables Row 2 */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Recent Transactions Table */}
        <motion.div variants={itemVariants} className="lg:col-span-2 min-w-0">
          <GlassCard className="h-full overflow-hidden flex flex-col">
            <SectionHeader 
              title="Recent High-Risk Transactions (Demo Data)" 
              actions={
                <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={() => window.location.href='/transactions'}>
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              }
            />
            <div className="hidden lg:block overflow-x-auto pb-2 custom-scrollbar">
              <table className="w-full text-sm text-left min-w-[700px]">
                <thead className="text-xs text-muted-foreground uppercase bg-background/50 border-b border-border/50">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">ID</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Risk</th>
                    <th className="px-4 py-3 font-medium rounded-tr-lg text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentHighRisk.map((tx: any, idx: number) => (
                    <motion.tr 
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{tx.id}</td>
                      <td className="px-4 py-3 text-muted-foreground">{tx.type}</td>
                      <td className="px-4 py-3 font-medium">{formatINR(tx.amount)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{tx.location}</td>
                      <td className="px-4 py-3">
                        <RiskBadge level={tx.riskLevel as RiskLevel} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-right">{tx.timestamp.split(" ")[1] || tx.timestamp}</td>
                    </motion.tr>
                  ))}
                  {dashboardData.recentHighRisk.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No recent high-risk transactions.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden flex flex-col gap-3 mt-4 pb-2">
              {dashboardData.recentHighRisk.map((tx: any, idx: number) => (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="bg-background/40 border border-border/50 rounded-lg p-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-foreground">{tx.id}</div>
                      <div className="text-xs text-muted-foreground">{tx.timestamp}</div>
                    </div>
                    <RiskBadge level={tx.riskLevel as RiskLevel} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Type</div>
                      <div className="font-medium">{tx.type}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Amount</div>
                      <div className="font-medium text-destructive">{formatINR(tx.amount)}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground">Location</div>
                      <div className="truncate max-w-[250px]">{tx.location}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {dashboardData.recentHighRisk.length === 0 && (
                <div className="text-center p-6 text-muted-foreground text-sm border border-border/50 rounded-lg">
                  No recent high-risk transactions.
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Active Alerts Panel */}
        <motion.div variants={itemVariants} className="min-w-0">
          <GlassCard className="h-full">
            <SectionHeader title="Active Alerts" />
            <div className="space-y-4 mt-2">
              {dashboardData.activeAlerts.map((alert: any, idx: number) => (
                <motion.div 
                  key={alert.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * idx }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background/40 border border-border/50 hover:border-border transition-colors overflow-hidden"
                >
                  <div className={`shrink-0 mt-0.5 p-1.5 rounded-full ${alert.severity === 'critical' ? 'bg-destructive/20 text-destructive' : alert.severity === 'high' ? 'bg-destructive/10 text-destructive/80' : 'bg-warning/20 text-warning'}`}>
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium leading-none truncate">{alert.reason}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate mr-2">TX: {alert.transactionId}</span>
                      <span className="shrink-0">{alert.timestamp.split(" ")[1] || alert.timestamp}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {dashboardData.activeAlerts.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">No active alerts requiring attention.</div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Row 3 */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="lg:col-span-2 min-w-0">
          <GlassCard className="h-full">
            <SectionHeader title="Transaction Volume Overview (Demo Data)" />
            <VolumeChart data={dashboardData.timeData} />
          </GlassCard>
        </motion.div>
        
        <div className="space-y-4 flex flex-col min-w-0">
          <motion.div variants={itemVariants} className="min-w-0">
            <GlassCard>
              <SectionHeader title="Live Model Status" />
              <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20 mb-3 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="h-5 w-5 text-success shrink-0" />
                  <span className="text-sm font-medium truncate">Ensemble Online</span>
                </div>
                {health && <div className="h-2 w-2 rounded-full bg-success animate-pulse shrink-0 ml-2" />}
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground truncate mr-2">XGBoost</span>
                  <span className="font-medium text-success shrink-0 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success"></span> Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground truncate mr-2">Isolation Forest</span>
                  <span className="font-medium text-success shrink-0 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success"></span> Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground truncate mr-2">Autoencoder</span>
                  <span className="font-medium text-success shrink-0 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success"></span> Online</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex-1 min-w-0">
            <GlassCard className="h-full overflow-hidden">
              <SectionHeader title="AI Detection Summary" />
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border/50">
                  <span className="text-sm font-medium">Transactions Analyzed</span>
                  <span className="text-sm font-bold text-primary">{dashboardData.totalTransactions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border/50">
                  <span className="text-sm font-medium">Potential Fraud</span>
                  <span className="text-sm font-bold text-warning">{(dashboardData.suspicious + dashboardData.fraudDetected).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border/50">
                  <span className="text-sm font-medium">High-Risk (Score 60-79)</span>
                  <span className="text-sm font-bold text-orange-500">{dashboardData.suspicious.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-background/50 border border-border/50">
                  <span className="text-sm font-medium">Critical (Score 80+)</span>
                  <span className="text-sm font-bold text-destructive">{dashboardData.fraudDetected.toLocaleString()}</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
