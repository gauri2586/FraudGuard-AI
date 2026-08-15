import { motion, AnimatePresence } from "framer-motion"
import { X, ShieldAlert, Activity, Cpu, AlertTriangle, Fingerprint, Network } from "lucide-react"
import { Button } from "../ui/button"
import { RiskBadge, RiskLevel } from "../ui/RiskBadge"
import { StatusBadge, StatusType } from "../ui/StatusBadge"
import { ProgressIndicator } from "../ui/ProgressIndicator"
import { TransactionDetail } from "@/data/mockTransactions"

interface DrawerProps {
  transaction: TransactionDetail | null
  isOpen: boolean
  onClose: () => void
  onAction?: (action: string) => void
}

export function TransactionDrawer({ transaction, isOpen, onClose, onAction }: DrawerProps) {
  if (!transaction) return null

  const getRiskColorClass = (score: number) => {
    if (score <= 30) return "bg-success"
    if (score <= 60) return "bg-warning"
    if (score <= 80) return "bg-orange-500"
    return "bg-destructive"
  }

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
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border/50 bg-card shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/50 backdrop-blur-md">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Investigation Panel</h2>
                <p className="text-xs text-muted-foreground">{transaction.id}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              
              {/* Header Info */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="text-3xl font-bold">₹{transaction.amount.toFixed(2)}</div>
                <div className="text-muted-foreground">{transaction.merchant}</div>
                <div className="flex items-center gap-2 mt-2">
                  <RiskBadge level={getRiskLevel(transaction.riskScore)} />
                  <StatusBadge status={transaction.status as StatusType} />
                </div>
              </div>

              {/* Main Risk Score */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">AI Risk Score</span>
                  </div>
                  <span className="text-lg font-bold">{transaction.riskScore}/100</span>
                </div>
                <ProgressIndicator 
                  value={transaction.riskScore} 
                  colorClass={getRiskColorClass(transaction.riskScore)}
                  className="h-3"
                />
              </div>

              {/* Transaction Details */}
              <div className="space-y-4 rounded-xl border border-border/50 bg-background/30 p-4">
                <h3 className="font-semibold text-sm mb-3">Transaction Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">User</span>
                    <span className="font-medium">{transaction.user}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Type</span>
                    <span className="font-medium">{transaction.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Location</span>
                    <span className="font-medium">{transaction.location}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Device</span>
                    <span className="font-medium">{transaction.device}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-xs">Timestamp</span>
                    <span className="font-medium">{transaction.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* AI Explanation */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-primary" />
                  <span className="font-semibold tracking-wider text-sm">SHAP EXPLANATIONS</span>
                </div>
                
                {transaction.explanations && transaction.explanations.length > 0 ? (
                  <div className="space-y-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
                    {transaction.explanations.map((exp: any, i: number) => (
                      <div key={i} className="flex justify-between items-start border-b border-border/50 pb-3 last:border-0 last:pb-0">
                         <div>
                           <div className="text-sm font-medium">{exp.display_name}</div>
                           <div className="text-xs text-muted-foreground mt-0.5">
                             {exp.direction === 'increases_risk' ? 'Increases risk' : 'Decreases risk'}
                           </div>
                         </div>
                         <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                           exp.direction === 'increases_risk' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                         }`}>
                           {exp.direction === 'increases_risk' ? '↑' : '↓'}
                           {Math.abs(exp.impact * 100).toFixed(1)}
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground p-3 rounded-md bg-primary/5 border border-primary/10">
                    {transaction.explanation}
                  </p>
                )}
              </div>

              {/* Indicators */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Anomaly Indicators
                  </div>
                  {transaction.anomalyIndicators.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      {transaction.anomalyIndicators.map((ind, i) => <li key={i}>{ind}</li>)}
                    </ul>
                  ) : (
                    <span className="text-sm text-muted-foreground pl-1">No anomalies detected.</span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Fingerprint className="h-4 w-4 text-secondary" />
                    Behavioral Indicators
                  </div>
                  {transaction.behavioralIndicators.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      {transaction.behavioralIndicators.map((ind, i) => <li key={i}>{ind}</li>)}
                    </ul>
                  ) : (
                    <span className="text-sm text-muted-foreground pl-1">No behavioral flags.</span>
                  )}
                </div>
              </div>

              {/* Model Scores */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Ensemble Model Scores</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">XGBoost (Classification)</span>
                    <span className="font-medium">{transaction.modelScores.xgboost}/100</span>
                  </div>
                  <ProgressIndicator value={transaction.modelScores.xgboost} colorClass="bg-primary" className="h-1.5" />
                  
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-muted-foreground">Isolation Forest (Anomaly)</span>
                    <span className="font-medium">{transaction.modelScores.isolationForest}/100</span>
                  </div>
                  <ProgressIndicator value={transaction.modelScores.isolationForest} colorClass="bg-secondary" className="h-1.5" />
                  
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-muted-foreground">Autoencoder (Reconstruction)</span>
                    <span className="font-medium">{transaction.modelScores.autoencoder}/100</span>
                  </div>
                  <ProgressIndicator value={transaction.modelScores.autoencoder} colorClass="bg-orange-500" className="h-1.5" />
                </div>
              </div>
            </div>
            
            {/* Action Footer */}
            <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-md flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => onAction && onAction("mark_safe")}>Mark Safe</Button>
              <Button variant="destructive" className="flex-1" onClick={() => onAction && onAction("block_user")}>Block User</Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
