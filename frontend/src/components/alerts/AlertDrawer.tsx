import { motion, AnimatePresence } from "framer-motion"
import { X, ShieldAlert, CheckCircle, Clock, Search, AlertTriangle, AlertOctagon } from "lucide-react"
import { Button } from "../ui/button"
import { RiskBadge, RiskLevel } from "../ui/RiskBadge"
import { StatusBadge, StatusType } from "../ui/StatusBadge"
import { FraudAlert } from "@/data/mockAlerts"

interface AlertDrawerProps {
  alert: FraudAlert | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (id: string, newStatus: StatusType) => void
}

export function AlertDrawer({ alert, isOpen, onClose, onUpdateStatus }: AlertDrawerProps) {
  if (!alert) return null

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
                <h2 className="text-lg font-semibold tracking-tight">Alert Investigation</h2>
                <p className="text-xs text-muted-foreground">{alert.id}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              {/* Header Info */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`p-3 rounded-full ${alert.severity === 'critical' ? 'bg-destructive/20 text-destructive' : alert.severity === 'high' ? 'bg-orange-500/20 text-orange-500' : 'bg-warning/20 text-warning'}`}>
                  {alert.severity === 'critical' ? <AlertOctagon className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                </div>
                <div className="text-2xl font-bold">${alert.amount.toFixed(2)}</div>
                <div className="text-muted-foreground">User: {alert.user}</div>
                <div className="flex items-center gap-2 mt-2">
                  <RiskBadge level={getRiskLevel(alert.riskScore)} />
                  <StatusBadge status={alert.status} />
                </div>
              </div>

              {/* Transaction Link */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/30 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">Transaction ID</span>
                  <span className="font-mono font-medium">{alert.transactionId}</span>
                </div>
                <Button variant="secondary" size="sm" className="h-8">
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                  View Tx
                </Button>
              </div>

              {/* Reasons */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  Detection Reasons
                </h3>
                <ul className="space-y-2">
                  {alert.reasons.map((reason, i) => (
                    <li key={i} className="text-sm p-2 rounded-md bg-destructive/10 text-destructive-foreground border border-destructive/20">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Timeline Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Metadata</h3>
                <div className="grid grid-cols-2 gap-4 text-sm rounded-xl border border-border/50 bg-background/30 p-4">
                  <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Detected: {alert.time}
                  </div>
                  {alert.assignedTo && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-xs">Assigned To</span>
                      <span className="font-medium">{alert.assignedTo}</span>
                    </div>
                  )}
                  {alert.notes && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-xs">Investigation Notes</span>
                      <span className="text-sm">{alert.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Footer */}
            <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-md space-y-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => onUpdateStatus(alert.id, "investigating")}
                  disabled={alert.status === "investigating"}
                  className="w-full text-xs"
                >
                  Investigating
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => onUpdateStatus(alert.id, "false_positive")}
                  disabled={alert.status === "false_positive"}
                  className="w-full text-xs bg-muted/50 hover:bg-muted"
                >
                  False Positive
                </Button>
                <Button 
                  variant="default" 
                  className="w-full text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onUpdateStatus(alert.id, "confirmed_fraud")}
                  disabled={alert.status === "confirmed_fraud"}
                >
                  Confirm Fraud
                </Button>
                <Button 
                  variant="default" 
                  className="w-full text-xs bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => onUpdateStatus(alert.id, "resolved")}
                  disabled={alert.status === "resolved"}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Resolve
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
