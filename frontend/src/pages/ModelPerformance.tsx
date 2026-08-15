import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ShieldCheck, Database, BrainCircuit, Workflow, Cpu, Crosshair, AlertTriangle, CheckCircle } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { GlassCard } from "@/components/ui/GlassCard"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { ConfusionMatrix } from "@/components/models/ModelCharts"
import { containerVariants, itemVariants } from "@/lib/animations"
import { ProgressIndicator } from "@/components/ui/ProgressIndicator"
import { getMetrics } from "@/services/api"

export default function ModelPerformancePage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getMetrics()
        setMetrics(data)
      } catch (e) {
        console.error("Failed to load metrics", e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  if (isLoading) {
    return <div className="p-20 text-center text-muted-foreground">Loading ML evaluation artifacts...</div>
  }

  const dataset = metrics?.dataset || {}
  const xgb = metrics?.xgboost || {}
  const iforest = metrics?.isolation_forest || {}
  const autoenc = metrics?.autoencoder || {}
  const cm = xgb.confusion_matrix || {}

  return (
    <motion.div 
      className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <PageHeader 
        title="ML Model Performance" 
        description="Evaluate the accuracy, efficiency, and methodology of the ensemble AI fraud detection engines using actual training artifacts."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-success mr-2 bg-success/10 px-3 py-1.5 rounded-md border border-success/20 flex items-center gap-1.5 font-medium">
              <CheckCircle className="h-3.5 w-3.5" /> 
              Connected to ML Artifacts
            </span>
          </div>
        }
      />

      {/* TRAINING DATASET */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <SectionHeader 
            title="Training Dataset Snapshot (IEEE-CIS)" 
            description="The baseline population used to train all FraudGuard AI models."
            icon={<Database className="h-5 w-5 text-primary" />}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-background/50 border border-border/50 text-center">
              <div className="text-xs text-muted-foreground mb-1">Total Transactions</div>
              <div className="text-2xl font-bold">{dataset.total_transactions?.toLocaleString() ?? "Not evaluated"}</div>
            </div>
            <div className="p-4 rounded-xl bg-background/50 border border-border/50 text-center border-b-2 border-b-success/50">
              <div className="text-xs text-muted-foreground mb-1">Legitimate Cases</div>
              <div className="text-2xl font-bold text-success">{dataset.legitimate_cases?.toLocaleString() ?? "Not evaluated"}</div>
            </div>
            <div className="p-4 rounded-xl bg-background/50 border border-border/50 text-center border-b-2 border-b-destructive/50">
              <div className="text-xs text-muted-foreground mb-1">Fraud Cases</div>
              <div className="text-2xl font-bold text-destructive">{dataset.fraud_cases?.toLocaleString() ?? "Not evaluated"}</div>
            </div>
            <div className="p-4 rounded-xl bg-background/50 border border-border/50 text-center">
              <div className="text-xs text-muted-foreground mb-1">Class Imbalance (Fraud)</div>
              <div className="text-2xl font-bold">{dataset.fraud_percentage ? `${dataset.fraud_percentage}%` : "Not evaluated"}</div>
            </div>
            <div className="p-4 rounded-xl bg-background/50 border border-border/50 text-center">
              <div className="text-xs text-muted-foreground mb-1">Feature Count</div>
              <div className="text-2xl font-bold">{dataset.feature_count ?? "Not evaluated"}</div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* MODEL PERFORMANCE (XGBOOST) */}
        <motion.div variants={itemVariants} className="flex flex-col h-full">
          <GlassCard className="h-full border-t-4 border-t-primary">
            <SectionHeader 
              title="Supervised Performance (XGBoost)" 
              description="Evaluated on a strictly isolated 10% future temporal test set."
            />
            
            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="space-y-1 bg-background/30 p-3 rounded-lg border border-border/50 text-center">
                <p className="text-xs text-muted-foreground uppercase">Precision</p>
                <p className="text-xl font-bold">{xgb.precision ? `${xgb.precision}%` : "Not evaluated"}</p>
                <ProgressIndicator value={xgb.precision || 0} colorClass="bg-primary" className="h-1 mt-2" />
              </div>
              <div className="space-y-1 bg-background/30 p-3 rounded-lg border border-border/50 text-center">
                <p className="text-xs text-muted-foreground uppercase">Recall</p>
                <p className="text-xl font-bold">{xgb.recall ? `${xgb.recall}%` : "Not evaluated"}</p>
                <ProgressIndicator value={xgb.recall || 0} colorClass="bg-secondary" className="h-1 mt-2" />
              </div>
              <div className="space-y-1 bg-background/30 p-3 rounded-lg border border-border/50 text-center">
                <p className="text-xs text-muted-foreground uppercase">F1 Score</p>
                <p className="text-xl font-bold">{xgb.f1_score ? `${xgb.f1_score}%` : "Not evaluated"}</p>
                <ProgressIndicator value={xgb.f1_score || 0} colorClass="bg-warning" className="h-1 mt-2" />
              </div>
              <div className="space-y-1 bg-background/30 p-3 rounded-lg border border-border/50 text-center">
                <p className="text-xs text-muted-foreground uppercase">ROC-AUC / PR-AUC</p>
                <p className="text-xl font-bold">{xgb.roc_auc || "N/A"} / {xgb.pr_auc || "N/A"}</p>
              </div>
            </div>

            {cm.tp !== undefined ? (
              <div className="mt-4 border-t border-border/50 pt-4">
                <h4 className="text-sm font-semibold mb-2">Confusion Matrix (Test Set)</h4>
                <div className="flex items-center justify-center py-4 bg-background/30 rounded-xl overflow-x-auto custom-scrollbar">
                  <ConfusionMatrix tp={cm.tp} tn={cm.tn} fp={cm.fp} fn={cm.fn} />
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">Confusion Matrix Not Evaluated</div>
            )}
          </GlassCard>
        </motion.div>

        {/* ANOMALY DETECTION */}
        <motion.div variants={itemVariants} className="flex flex-col h-full gap-6">
          <GlassCard className="flex-1 border-l-4 border-l-warning">
            <div className="flex items-center gap-2 mb-2 text-warning">
              <Crosshair className="h-5 w-5" />
              <h3 className="font-bold text-lg">Isolation Forest</h3>
            </div>
            <div className="text-sm text-muted-foreground mb-4 pb-4 border-b border-border/50">
              <span className="font-semibold text-foreground">Methodology:</span> {iforest.methodology || "Not evaluated"}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-success/5 border border-success/20 p-3 rounded-lg text-center">
                <div className="text-xs text-success mb-1">Avg Legitimate Anomaly Score</div>
                <div className="text-xl font-bold text-success">{iforest.avg_legit_score ?? "Not evaluated"}</div>
              </div>
              <div className="bg-destructive/5 border border-destructive/20 p-3 rounded-lg text-center">
                <div className="text-xs text-destructive mb-1">Avg Fraudulent Anomaly Score</div>
                <div className="text-xl font-bold text-destructive">{iforest.avg_fraud_score ?? "Not evaluated"}</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="flex-1 border-l-4 border-l-secondary">
            <div className="flex items-center gap-2 mb-2 text-secondary">
              <Cpu className="h-5 w-5" />
              <h3 className="font-bold text-lg">Autoencoder</h3>
            </div>
            <div className="text-sm text-muted-foreground mb-4 pb-4 border-b border-border/50">
              <span className="font-semibold text-foreground">Methodology:</span> {autoenc.methodology || "Not evaluated"}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-success/5 border border-success/20 p-3 rounded-lg text-center">
                <div className="text-xs text-success mb-1">Avg Legitimate MSE Loss</div>
                <div className="text-xl font-bold text-success">{autoenc.avg_legit_error ?? "Not evaluated"}</div>
              </div>
              <div className="bg-destructive/5 border border-destructive/20 p-3 rounded-lg text-center">
                <div className="text-xs text-destructive mb-1">Avg Fraudulent MSE Loss</div>
                <div className="text-xl font-bold text-destructive">{autoenc.avg_fraud_error ?? "Not evaluated"}</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

      </div>

      {/* MODEL ARCHITECTURE */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <SectionHeader 
            title="Model Architecture & Roles" 
            description="The composition of the FraudGuard AI ensemble pipeline."
            icon={<BrainCircuit className="h-5 w-5 text-primary" />}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-background/50 border border-border/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Database className="h-16 w-16" />
              </div>
              <div className="flex items-center gap-2 mb-3 text-primary relative z-10">
                <h4 className="font-bold text-base">XGBoost</h4>
              </div>
              <p className="text-sm font-medium mb-2 relative z-10">Supervised fraud classification</p>
              <p className="text-xs text-muted-foreground leading-relaxed relative z-10">
                Predicts whether a transaction resembles historically labeled fraud cases using extreme gradient boosting trees.
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-background/50 border border-border/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Crosshair className="h-16 w-16" />
              </div>
              <div className="flex items-center gap-2 mb-3 text-warning relative z-10">
                <h4 className="font-bold text-base">Isolation Forest</h4>
              </div>
              <p className="text-sm font-medium mb-2 relative z-10">Unsupervised anomaly detection</p>
              <p className="text-xs text-muted-foreground leading-relaxed relative z-10">
                Isolates highly unusual data points from the norm, effectively catching zero-day fraud tactics that XGBoost has never seen.
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-background/50 border border-border/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Cpu className="h-16 w-16" />
              </div>
              <div className="flex items-center gap-2 mb-3 text-secondary relative z-10">
                <h4 className="font-bold text-base">Autoencoder</h4>
              </div>
              <p className="text-sm font-medium mb-2 relative z-10">Deep-learning reconstruction-based anomaly detection</p>
              <p className="text-xs text-muted-foreground leading-relaxed relative z-10">
                Forces transactions through a neural network bottleneck. Normal behavior reconstructs cleanly; anomalous behavior results in high reconstruction error.
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/30 shadow-[0_0_15px_rgba(14,165,233,0.1)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Workflow className="h-16 w-16" />
              </div>
              <div className="flex items-center gap-2 mb-3 text-success relative z-10">
                <h4 className="font-bold text-base">Hybrid Risk Engine</h4>
              </div>
              <p className="text-sm font-medium mb-2 relative z-10">Combines model signals into a unified risk score</p>
              <p className="text-xs text-muted-foreground leading-relaxed relative z-10">
                Ingests predictions from all three independent AI models, normalizing their outputs to compute a final, consensus-driven 0-100 risk score.
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

    </motion.div>
  )
}
