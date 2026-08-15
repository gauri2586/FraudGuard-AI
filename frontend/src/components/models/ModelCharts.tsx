import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

interface ChartProps {
  data: any[]
}

export function ModelComparisonChart({ data }: ChartProps) {
  return (
    <div className="h-[300px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
          <Tooltip 
            cursor={{fill: 'hsl(var(--secondary)/0.1)'}}
            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="Precision" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Recall" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="F1 Score" fill="hsl(var(--orange-500))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="ROC-AUC" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// A visual mock of a Confusion Matrix using a simple grid layout instead of Recharts
export function ConfusionMatrix({ tp, tn, fp, fn }: { tp: number, tn: number, fp: number, fn: number }) {
  const total = tp + tn + fp + fn
  const tpPct = ((tp / total) * 100).toFixed(1)
  const tnPct = ((tn / total) * 100).toFixed(1)
  const fpPct = ((fp / total) * 100).toFixed(1)
  const fnPct = ((fn / total) * 100).toFixed(1)

  return (
    <div className="w-full overflow-x-auto custom-scrollbar pb-2">
      <div className="grid grid-cols-[auto_1fr_1fr] gap-2 mb-2 min-w-[360px] max-w-md mx-auto">
        <div className="flex items-end justify-end pr-2 pb-2 text-xs text-muted-foreground font-semibold">
          Actual ↓
        </div>
        <div className="text-center pb-2 text-xs text-muted-foreground font-semibold border-b border-border/50">
          Predicted Positive
        </div>
        <div className="text-center pb-2 text-xs text-muted-foreground font-semibold border-b border-border/50">
          Predicted Negative
        </div>

        <div className="flex items-center justify-end pr-4 text-xs text-muted-foreground font-semibold border-r border-border/50">
          Actual Positive
        </div>
        <div className="aspect-square bg-success/20 rounded-lg flex flex-col items-center justify-center border border-success/30 p-2">
          <span className="text-2xl font-bold text-success">{tp}</span>
          <span className="text-xs text-success-foreground mt-1">True Positive</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{tpPct}%</span>
        </div>
        <div className="aspect-square bg-destructive/10 rounded-lg flex flex-col items-center justify-center border border-destructive/20 p-2">
          <span className="text-2xl font-bold text-destructive">{fn}</span>
          <span className="text-xs text-destructive-foreground mt-1 text-center">False Negative<br/>(Missed Fraud)</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{fnPct}%</span>
        </div>

        <div className="flex items-center justify-end pr-4 text-xs text-muted-foreground font-semibold border-r border-border/50">
          Actual Negative
        </div>
        <div className="aspect-square bg-warning/10 rounded-lg flex flex-col items-center justify-center border border-warning/20 p-2">
          <span className="text-2xl font-bold text-warning">{fp}</span>
          <span className="text-xs text-warning-foreground mt-1 text-center">False Positive<br/>(False Alarm)</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{fpPct}%</span>
        </div>
        <div className="aspect-square bg-primary/20 rounded-lg flex flex-col items-center justify-center border border-primary/30 p-2">
          <span className="text-2xl font-bold text-primary">{tn}</span>
          <span className="text-xs text-primary-foreground mt-1">True Negative</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{tnPct}%</span>
        </div>
      </div>
    </div>
  )
}
