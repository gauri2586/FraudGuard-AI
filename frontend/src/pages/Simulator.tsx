import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, CheckCircle2, ShieldAlert, Cpu, Activity, Database, BrainCircuit, ArrowRight, Server, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { GlassCard } from "@/components/ui/GlassCard"
import { Button } from "@/components/ui/button"
import { RiskBadge, RiskLevel } from "@/components/ui/RiskBadge"
import { containerVariants, itemVariants } from "@/lib/animations"
import { simulateTransaction, checkBackendHealth } from "@/services/api"
import { AnimatedNumber } from "@/components/ui/AnimatedNumber"
import { cn } from "@/lib/utils"

interface Explanation {
  feature: string;
  value: number | string;
  shap_value: number;
  effect: 'increases_risk' | 'decreases_risk';
  explanation: string;
}

interface SimulationResult {
  transaction_id: string;
  risk_score: number;
  risk_level: string;
  fraud_probability: number;
  is_fraud: boolean;
  requires_investigation: boolean;
  model_scores: {
    xgboost: number;
    isolation_forest: number;
    autoencoder: number;
  };
  explanations: Explanation[];
  model_status: string;
  message?: string;
}

// --- Scenarios ---
const SCENARIOS = [
  {
    id: "normal",
    title: "Normal Transaction",
    description: "Typical user behavior, standard amount.",
    icon: <CheckCircle2 className="h-5 w-5 text-success" />,
    payload: {
      amount: 45.50,
      merchant_category: "Groceries",
      location: "Local",
      device_type: "Mobile_App",
      timestamp: "2023-11-01T14:30:00Z"
    }
  },
  {
    id: "high_value",
    title: "High-Value Transfer",
    description: "Extremely large sum transferred suddenly.",
    icon: <AlertTriangle className="h-5 w-5 text-warning" />,
    payload: {
      amount: 15000.00,
      merchant_category: "Electronics",
      location: "Local",
      device_type: "Desktop_Web",
      timestamp: "2023-11-01T10:15:00Z"
    }
  },
  {
    id: "unusual_location",
    title: "Unusual Location",
    description: "Transaction originating from a high-risk IP.",
    icon: <Activity className="h-5 w-5 text-warning" />,
    payload: {
      amount: 120.00,
      merchant_category: "Travel",
      location: "HighRiskCountry",
      device_type: "Mobile_App",
      timestamp: "2023-11-01T08:00:00Z"
    }
  },
  {
    id: "new_device",
    title: "New Device (API)",
    description: "Scripted attack using a headless browser/API.",
    icon: <Cpu className="h-5 w-5 text-orange-500" />,
    payload: {
      amount: 450.00,
      merchant_category: "Gaming",
      location: "Unknown",
      device_type: "API",
      timestamp: "2023-11-01T22:45:00Z"
    }
  },
  {
    id: "multiple_anomaly",
    title: "Multiple Anomalies",
    description: "Late night, huge amount, crypto exchange.",
    icon: <ShieldAlert className="h-5 w-5 text-destructive" />,
    payload: {
      amount: 9800.00,
      merchant_category: "Crypto",
      location: "Unknown",
      device_type: "API",
      timestamp: "2023-11-01T03:30:00Z" // Late night
    }
  }
]

// --- Pipeline Steps ---
const PIPELINE_STEPS = [
  { id: "ingestion", label: "Transaction Received", icon: <Database className="h-4 w-4" /> },
  { id: "features", label: "Feature Processing", icon: <Cpu className="h-4 w-4" /> },
  { id: "xgboost", label: "XGBoost Analysis", icon: <BrainCircuit className="h-4 w-4" /> },
  { id: "iforest", label: "Anomaly Detection", icon: <Server className="h-4 w-4" /> },
  { id: "autoencoder", label: "Autoencoder Analysis", icon: <Activity className="h-4 w-4" /> },
  { id: "hybrid", label: "Hybrid Risk Engine", icon: <ShieldAlert className="h-4 w-4" /> },
  { id: "shap", label: "SHAP Explanation", icon: <Cpu className="h-4 w-4" /> },
  { id: "decision", label: "Risk Decision", icon: <CheckCircle2 className="h-4 w-4" /> }
]

export default function Simulator() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0])
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [systemStatus, setSystemStatus] = useState<"DEMO" | "LIVE">("DEMO")

  const [customPayload, setCustomPayload] = useState(SCENARIOS[0].payload)

  useEffect(() => {
    checkBackendHealth().then(isHealthy => {
      if (isHealthy) setSystemStatus("LIVE")
    })
  }, [])

  // Sync custom payload when scenario changes
  useEffect(() => {
    setCustomPayload(selectedScenario.payload)
  }, [selectedScenario])

  const runSimulation = async () => {
    setIsSimulating(true)
    setResult(null)
    setError(null)
    setCurrentStepIndex(0)

    try {
      // 1. Prepare Payload
      const txPayload = {
        transaction_id: `TX-DEMO-${Math.floor(Math.random() * 99999)}`,
        user_id: `USR-DEMO-${Math.floor(Math.random() * 999)}`,
        transaction_type: "Purchase",
        account_age_days: 365,
        transaction_frequency: 3,
        previous_transaction_amount: 50.0,
        time_since_last_transaction: 86400,
        is_international: false,
        has_new_device: false,
        ...customPayload
      }

      // 2. Start API request
      const apiPromise = simulateTransaction(txPayload)
      
      // 3. Smooth sequential animation
      for (let i = 0; i < PIPELINE_STEPS.length; i++) {
        setCurrentStepIndex(i)
        // Wait 250ms between steps to show smooth progression
        await new Promise(resolve => setTimeout(resolve, 250))
      }
      
      // Wait for actual API to finish if it hasn't already
      const apiResult = await apiPromise;
      
      setCurrentStepIndex(PIPELINE_STEPS.length); // complete
      
      if (apiResult.model_status === "ERROR") {
        throw new Error(apiResult.message || "Backend ML models are currently offline or unavailable.")
      }
      
      setResult(apiResult)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Unable to connect to FraudGuard AI backend. Please make sure the backend server is running.")
    } finally {
      setIsSimulating(false)
    }
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
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <PageHeader 
          title="Demo Transaction Simulator" 
          description="Visually trace exactly how the AI ensemble processes and scores transactions."
        />
        <div className={cn(
          "px-4 py-2 border rounded-full text-xs font-bold tracking-widest",
          systemStatus === "LIVE" ? "bg-success/10 text-success border-success/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]" : "bg-destructive/10 text-destructive border-destructive/20 animate-pulse"
        )}>
          MODEL STATUS: {systemStatus}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Side: Scenarios */}
        <div className="lg:col-span-5 space-y-4">
          <GlassCard className="p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Select Scenario</h2>
              <p className="text-sm text-muted-foreground">Choose a transaction template to inject into the ML pipeline.</p>
            </div>
            
            <div className="space-y-3">
              {SCENARIOS.map((scenario) => (
                <div 
                  key={scenario.id}
                  onClick={() => !isSimulating && setSelectedScenario(scenario)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3",
                    selectedScenario.id === scenario.id 
                      ? "bg-primary/10 border-primary" 
                      : "bg-background/50 border-border/50 hover:bg-secondary/20",
                    isSimulating && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="mt-0.5">{scenario.icon}</div>
                  <div>
                    <div className="font-medium text-sm">{scenario.title}</div>
                    <div className="text-xs text-muted-foreground">{scenario.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              className="w-full mt-4" 
              size="lg" 
              onClick={runSimulation}
              disabled={isSimulating}
            >
              <Play className={cn("mr-2 h-4 w-4", isSimulating && "animate-pulse")} />
              {isSimulating ? "Simulating..." : "Run Simulation"}
            </Button>
          </GlassCard>

          <GlassCard className="p-4">
             <h3 className="text-sm font-semibold mb-3">Edit Transaction Values</h3>
             <div className="space-y-3">
               <div>
                 <label className="text-xs text-muted-foreground mb-1 block">Amount (₹)</label>
                 <input 
                   type="number"
                   value={customPayload.amount}
                   onChange={e => setCustomPayload({...customPayload, amount: parseFloat(e.target.value) || 0})}
                   disabled={isSimulating}
                   className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                 />
               </div>
               <div>
                 <label className="text-xs text-muted-foreground mb-1 block">Merchant Category</label>
                 <input 
                   type="text"
                   value={customPayload.merchant_category}
                   onChange={e => setCustomPayload({...customPayload, merchant_category: e.target.value})}
                   disabled={isSimulating}
                   className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                 />
               </div>
               <div>
                 <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                 <input 
                   type="text"
                   value={customPayload.location}
                   onChange={e => setCustomPayload({...customPayload, location: e.target.value})}
                   disabled={isSimulating}
                   className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                 />
               </div>
               <div>
                 <label className="text-xs text-muted-foreground mb-1 block">Device Type</label>
                 <select 
                   value={customPayload.device_type}
                   onChange={e => setCustomPayload({...customPayload, device_type: e.target.value})}
                   disabled={isSimulating}
                   className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                 >
                   <option value="Mobile_App">Mobile App</option>
                   <option value="Desktop_Web">Desktop Web</option>
                   <option value="API">API</option>
                 </select>
               </div>
             </div>
          </GlassCard>
        </div>

        {/* Right Side: Pipeline Visualization & Results */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard className="p-6 relative overflow-hidden">
            <h2 className="text-lg font-semibold mb-6">AI Pipeline Visualization</h2>
            
            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border before:to-transparent">
              {PIPELINE_STEPS.map((step, index) => {
                const isPassed = index < currentStepIndex
                const isActive = index === currentStepIndex
                
                return (
                  <div key={step.id} className="relative flex items-center gap-4">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 z-10 transition-colors duration-500",
                      isActive ? "border-primary bg-primary/20 text-primary animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.5)]" : 
                      isPassed ? "border-success bg-success/20 text-success" : 
                      "border-background bg-secondary text-muted-foreground"
                    )}>
                      {isPassed ? <CheckCircle2 className="h-5 w-5" /> : step.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className={cn(
                        "font-medium transition-colors duration-500",
                        isActive ? "text-primary" : 
                        isPassed ? "text-foreground" : 
                        "text-muted-foreground"
                      )}>{step.label}</h4>
                      {isActive && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-xs text-muted-foreground mt-1"
                        >
                          Processing data...
                        </motion.div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">AI analysis unavailable</h3>
                    <p className="text-sm opacity-90">{error}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={runSimulation}
                  className="shrink-0 border-destructive/30 hover:bg-destructive/20 text-destructive"
                >
                  Retry Simulation
                </Button>
              </motion.div>
            )}
            
            {result && !error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <GlassCard className={cn(
                  "p-6 border-l-4 mt-4",
                  result.risk_level === 'CRITICAL' ? 'border-l-destructive shadow-[0_0_30px_rgba(239,68,68,0.15)]' :
                  result.risk_level === 'HIGH' ? 'border-l-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.15)]' :
                  result.risk_level === 'MEDIUM' ? 'border-l-warning shadow-[0_0_30px_rgba(234,179,8,0.15)]' :
                  'border-l-success shadow-[0_0_30px_rgba(34,197,94,0.15)]'
                )}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold">Analysis Complete</h2>
                        <span className="px-2 py-0.5 rounded text-xs font-bold tracking-widest bg-primary/20 text-primary border border-primary/30">
                          SIMULATION
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">ID: {result.transaction_id}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="text-sm text-muted-foreground mb-1">Final Risk Score</div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold"><AnimatedNumber value={result.risk_score} /></span>
                        <RiskBadge level={getRiskLevel(result.risk_score)} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Left: Probabilities & Models */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-background/40">
                         <div>
                           <div className="text-xs text-muted-foreground mb-1">Fraud Probability</div>
                           <div className="font-semibold text-lg">{(result.fraud_probability * 100).toFixed(1)}%</div>
                         </div>
                         <div>
                           <div className="text-xs text-muted-foreground mb-1">Fraud Detected</div>
                           <div className={cn("font-semibold text-lg", result.is_fraud ? "text-destructive" : "text-success")}>
                             {result.is_fraud ? "YES" : "NO"}
                           </div>
                         </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-background/40 space-y-4">
                        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground">AI MODEL BREAKDOWN</h3>
                        
                        <div className="space-y-3">
                          {/* XGBoost Bar */}
                          <div>
                             <div className="flex justify-between text-xs mb-1 font-medium">
                               <span>XGBoost (Supervised)</span>
                               <span className="font-mono">{result.model_scores.xgboost}</span>
                             </div>
                             <div className="h-2 bg-secondary rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${result.model_scores.xgboost}%` }}
                                 transition={{ duration: 1, delay: 0.2 }}
                                 className="h-full bg-primary" 
                               />
                             </div>
                          </div>
                          
                          {/* IF Bar */}
                          <div>
                             <div className="flex justify-between text-xs mb-1 font-medium">
                               <span>Isolation Forest (Anomaly)</span>
                               <span className="font-mono">{result.model_scores.isolation_forest}</span>
                             </div>
                             <div className="h-2 bg-secondary rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${result.model_scores.isolation_forest}%` }}
                                 transition={{ duration: 1, delay: 0.4 }}
                                 className="h-full bg-warning" 
                               />
                             </div>
                          </div>
                          
                          {/* AE Bar */}
                          <div>
                             <div className="flex justify-between text-xs mb-1 font-medium">
                               <span>Autoencoder (Reconstruction)</span>
                               <span className="font-mono">{result.model_scores.autoencoder}</span>
                             </div>
                             <div className="h-2 bg-secondary rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${result.model_scores.autoencoder}%` }}
                                 transition={{ duration: 1, delay: 0.6 }}
                                 className="h-full bg-destructive" 
                               />
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Explainability */}
                    <div className="p-4 rounded-lg bg-background/40">
                      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground mb-4">WHY WAS THIS TRANSACTION FLAGGED?</h3>
                      <div className="space-y-3">
                        {result.explanations?.length > 0 ? (
                          result.explanations.map((exp: Explanation, i: number) => (
                            <motion.div 
                              key={i} 
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.5 + (i * 0.1) }}
                              className="flex justify-between items-start border-b border-border/50 pb-3 last:border-0 last:pb-0"
                            >
                               <div>
                                 <div className="text-sm font-medium">{exp.feature}</div>
                                 <div className="text-xs text-muted-foreground mt-0.5">
                                   {exp.explanation}
                                 </div>
                               </div>
                               <div className={cn(
                                 "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                                 exp.effect === 'increases_risk' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                               )}>
                                 {exp.effect === 'increases_risk' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                 {Math.abs(exp.shap_value * 100).toFixed(1)}
                               </div>
                            </motion.div>
                          ))
                        ) : (
                           <div className="text-sm text-muted-foreground italic py-4 text-center">No significant flags detected.</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {result.message && (
                    <div className="mt-6 p-4 rounded-lg bg-secondary/30 text-sm border border-border/50 text-foreground">
                      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground mb-2 uppercase">Investigation Recommendation</h3>
                      <p>{result.message}</p>
                    </div>
                  )}
                  
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
