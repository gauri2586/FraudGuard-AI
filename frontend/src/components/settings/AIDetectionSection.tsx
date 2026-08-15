import { useState } from "react"
import { BrainCircuit, ShieldAlert, Lock, CheckCircle2 } from "lucide-react"
import { SettingsSection, SettingsRow, SettingSlider } from "./SharedComponents"
import { Button } from "../ui/button"

export function AIDetectionSection() {
  const [threshold] = useState(60)

  return (
    <SettingsSection title="AI Model Settings" icon={BrainCircuit} description="Configure ensemble model parameters and risk thresholds.">
      
      <div className="py-2 sm:px-6 px-4 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider -mx-4 sm:-mx-6 my-2 border-y border-border/50">Ensemble Status</div>
      
      <SettingsRow title="XGBoost Classifier" description="Supervised fraud classification model.">
        <div className="flex items-center gap-2 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" />
          Online
        </div>
      </SettingsRow>
      
      <SettingsRow title="Isolation Forest" description="Unsupervised tabular anomaly detection.">
        <div className="flex items-center gap-2 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" />
          Online
        </div>
      </SettingsRow>

      <SettingsRow title="Autoencoder Network" description="Deep learning reconstruction anomaly detection.">
        <div className="flex items-center gap-2 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" />
          Online
        </div>
      </SettingsRow>

      <div className="py-2 sm:px-6 px-4 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider -mx-4 sm:-mx-6 my-2 border-y border-border/50">Risk Configuration</div>
      
      <SettingsRow 
        title="Global Risk Threshold" 
        description="Transactions scoring above this threshold will automatically trigger a Critical Fraud Alert."
      >
        <div className="space-y-3 opacity-70 pointer-events-none">
          <SettingSlider value={threshold} onChange={() => {}} min={0} max={100} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Lenient (Higher False Positives)</span>
            <span>Strict (Higher False Negatives)</span>
          </div>
        </div>
      </SettingsRow>
      
      <div className="px-4 sm:px-6 py-4 flex items-center gap-3 bg-secondary/10 border-t border-border/50 rounded-b-lg">
        <div className="p-2 bg-background rounded-full border border-border">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Administrator privileges required.</span> Security-critical model settings cannot be modified by standard analysts.
        </div>
      </div>
      
    </SettingsSection>
  )
}
