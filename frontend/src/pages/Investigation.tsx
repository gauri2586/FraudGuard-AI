import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ShieldAlert, Info, MapPin, Smartphone, User, FileText, Cpu, AlertOctagon, Network, History, CheckCircle2, Clock, Search, AlertTriangle } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { GlassCard } from "@/components/ui/GlassCard"
import { Button } from "@/components/ui/button"
import { ProgressIndicator } from "@/components/ui/ProgressIndicator"
import { AnimatedRiskScore } from "@/components/investigation/AnimatedRiskScore"
import { RiskFactorChart } from "@/components/investigation/RiskFactorChart"
import { containerVariants, itemVariants } from "@/lib/animations"
import { getTransactions } from "@/services/api"
import { TransactionDetail } from "@/data/mockTransactions"
import { cn } from "@/lib/utils"

export default function InvestigationPage() {
  const [transactions, setTransactions] = useState<TransactionDetail[]>([])
  const [selectedTxId, setSelectedTxId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTransactions()
        if (Array.isArray(data) && data.length > 0) {
          const mapped: TransactionDetail[] = data.map((tx: any) => ({
            id: tx.id,
            user: tx.user,
            amount: tx.amount,
            merchant: tx.merchant,
            location: tx.location || "Online",
            device: tx.device,
            timestamp: tx.timestamp,
            riskScore: tx.riskScore,
            status: tx.status,
            type: tx.type,
            aiConfidence: tx.aiConfidence,
            models: tx.modelScores,
            modelScores: tx.modelScores,
            anomalyIndicators: [],
            behavioralIndicators: [],
            explanation: "Dynamic SHAP analysis",
            explanations: tx.explanations || [],
            reasons: tx.reasons || [],
            ipAddress: "192.168.1.1",
            historyCount: 15
          }))
          setTransactions(mapped)
          setSelectedTxId(mapped[0].id)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const selectedTx = transactions.find(t => t.id === selectedTxId)

  const getRecommendation = (score: number) => {
    if (score >= 80) return { text: "High probability of anomaly. Recommend manual investigation and potential block.", icon: AlertOctagon, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" }
    if (score >= 60) return { text: "Potential anomaly detected. Requires manual review.", icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" }
    return { text: "Low-risk transaction. No immediate action required.", icon: CheckCircle2, color: "text-success", bg: "bg-success/10 border-success/20" }
  }

  const recommendation = selectedTx ? getRecommendation(selectedTx.riskScore) : null

  return (
    <motion.div 
      className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <PageHeader 
        title="AI Investigation Workspace" 
        description="Deep-dive analysis of flagged transactions using explainable AI models."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-success mr-2 bg-success/10 px-2 py-1 rounded-md border border-success/20 flex items-center gap-1 font-bold">
              MODEL STATUS: LIVE
            </span>
          </div>
        }
      />

      {/* Selector */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 items-center bg-background/50 p-4 rounded-xl border border-border/50">
        <div className="text-sm font-semibold flex items-center gap-2 shrink-0">
          <Search className="h-4 w-4" /> Select Transaction:
        </div>
        <select 
          className="flex-1 max-w-md h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={selectedTxId}
          onChange={(e) => setSelectedTxId(e.target.value)}
          disabled={isLoading || transactions.length === 0}
        >
          {isLoading ? (
            <option>Loading transactions...</option>
          ) : transactions.length > 0 ? (
            transactions.map(t => (
              <option key={t.id} value={t.id}>{t.id} - {t.user} - ₹{t.amount.toFixed(2)}</option>
            ))
          ) : (
            <option>No transactions available</option>
          )}
        </select>
        <div className="text-xs text-muted-foreground ml-auto hidden md:block">
          {transactions.length} live records available
        </div>
      </motion.div>

      {selectedTx ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT PANEL: Context */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <motion.div variants={itemVariants}>
              <GlassCard className="h-full">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-4 border-b border-border/50 pb-2 uppercase tracking-wider">
                  <FileText className="h-4 w-4 text-primary" /> Transaction Overview
                </h3>
                
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="text-4xl font-bold">₹{selectedTx.amount.toFixed(2)}</div>
                  <div className="mt-1 text-xs font-mono bg-background/50 px-2 py-1 rounded border border-border/50">{selectedTx.id}</div>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><User className="h-3 w-3" /> User</span>
                    <span className="font-medium">{selectedTx.user}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><MapPin className="h-3 w-3" /> Location</span>
                    <span className="font-medium">{selectedTx.location}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Smartphone className="h-3 w-3" /> Device</span>
                    <span className="font-medium">{selectedTx.device}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><FileText className="h-3 w-3" /> Payment Method</span>
                    <span className="font-medium">{selectedTx.type}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Clock className="h-3 w-3" /> Timestamp</span>
                    <span className="font-medium">{selectedTx.timestamp}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* CENTER PANEL: AI Engine */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <motion.div variants={itemVariants} className="flex-1">
              <GlassCard className={cn("h-full flex flex-col border-t-4", selectedTx.riskScore >= 60 ? "border-t-destructive" : "border-t-success")}>
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-2 uppercase tracking-wider">
                  <Cpu className="h-4 w-4 text-primary" /> AI Risk Assessment
                </h3>
                
                <div className="mt-4">
                  <AnimatedRiskScore score={selectedTx.riskScore} />
                </div>
                
                <div className="text-center mt-2 mb-6">
                  <div className="text-sm font-semibold uppercase">Risk Level: {selectedTx.riskScore >= 80 ? "Critical" : selectedTx.riskScore >= 60 ? "High" : selectedTx.riskScore >= 30 ? "Medium" : "Low"}</div>
                  <div className="text-xs text-muted-foreground">Fraud Probability: {selectedTx.aiConfidence}%</div>
                </div>

                <div className="space-y-4 mt-auto pt-6 border-t border-border/50">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Model Consensus</h4>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span>XGBoost (Classification)</span>
                      <span className="font-medium">{selectedTx.modelScores.xgboost}%</span>
                    </div>
                    <ProgressIndicator value={selectedTx.modelScores.xgboost} colorClass="bg-primary" className="h-1.5" />
                    
                    <div className="flex justify-between items-center pt-1">
                      <span>Isolation Forest (Anomaly)</span>
                      <span className="font-medium">{selectedTx.modelScores.isolationForest}%</span>
                    </div>
                    <ProgressIndicator value={selectedTx.modelScores.isolationForest} colorClass="bg-warning" className="h-1.5" />
                    
                    <div className="flex justify-between items-center pt-1">
                      <span>Autoencoder (Reconstruction)</span>
                      <span className="font-medium">{selectedTx.modelScores.autoencoder}%</span>
                    </div>
                    <ProgressIndicator value={selectedTx.modelScores.autoencoder} colorClass="bg-destructive" className="h-1.5" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* RIGHT PANEL: Explainability & Action */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <motion.div variants={itemVariants}>
              <GlassCard>
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-4 border-b border-border/50 pb-2 uppercase tracking-wider">
                  <Network className="h-4 w-4 text-secondary" /> Explainable AI (SHAP)
                </h3>
                <div className="space-y-3">
                  {selectedTx.explanations && selectedTx.explanations.length > 0 ? (
                    selectedTx.explanations.map((exp: any, i: number) => (
                      <div key={i} className="flex justify-between items-start border-b border-border/50 pb-3 last:border-0 last:pb-0">
                         <div>
                           <div className="text-sm font-medium">{exp.display_name}</div>
                           <div className="text-xs text-muted-foreground mt-0.5">
                             {exp.direction === 'increases_risk' ? 'Increases risk factor' : 'Decreases risk factor'}
                           </div>
                         </div>
                         <div className={cn("flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full", exp.direction === 'increases_risk' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>
                           {exp.direction === 'increases_risk' ? '↑' : '↓'}{Math.abs(exp.impact * 100).toFixed(1)}
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 text-center border border-dashed border-border/50 rounded-lg">
                      No significant SHAP factors isolated.
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={itemVariants} className="flex-1">
              <GlassCard className="h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-4 border-b border-border/50 pb-2 uppercase tracking-wider">
                    <History className="h-4 w-4 text-warning" /> Analysis Timeline
                  </h3>
                  
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-border pt-2 ml-1">
                    {[
                      { time: "0ms", event: "Data ingestion & mapping" },
                      { time: "+12ms", event: "Null imputation (Median/Constant)" },
                      { time: "+45ms", event: "XGBoost Classification" },
                      { time: "+60ms", event: "Isolation Forest Anomaly Check" },
                      { time: "+85ms", event: "Autoencoder Reconstruction" },
                      { time: "+100ms", event: "Hybrid Score Generated" }
                    ].map((item, idx) => (
                      <div key={idx} className="relative flex items-start gap-4">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-background bg-secondary shrink-0 z-10 mt-0.5"></div>
                        <div className="pb-1">
                          <p className="text-sm font-medium">{item.event}</p>
                          <p className="text-xs text-muted-foreground">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-border/50">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Investigation Recommendation</h4>
                  {recommendation && (
                    <div className={cn("p-3 rounded-lg border flex gap-3", recommendation.bg)}>
                      <recommendation.icon className={cn("h-5 w-5 shrink-0", recommendation.color)} />
                      <p className={cn("text-sm", recommendation.color)}>
                        {recommendation.text}
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </div>

        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">
          {isLoading ? "Loading intelligence payload..." : "Select a transaction to view its full AI investigation workspace."}
        </div>
      )}
    </motion.div>
  )
}
