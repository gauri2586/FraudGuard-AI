import React from "react"
import { GlassCard } from "./GlassCard"
import { cn } from "@/lib/utils"
import { AnimatedNumber } from "./AnimatedNumber"

interface StatCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  icon?: React.ReactNode
  trend?: number
  trendLabel?: string
  formatAsINR?: boolean
  className?: string
}

export function StatCard({
  title,
  value,
  prefix = "",
  suffix = "",
  icon,
  trend,
  trendLabel,
  formatAsINR,
  className,
}: StatCardProps) {
  const isPositive = trend && trend > 0
  const isNegative = trend && trend < 0

  return (
    <GlassCard className={cn("flex flex-col gap-1 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300", className)}>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-sm font-medium tracking-tight">{title}</span>
        {icon && <div className="text-muted-foreground/50">{icon}</div>}
      </div>
      
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-3xl font-semibold tracking-tight text-foreground">
          {prefix && !formatAsINR && prefix}
          <AnimatedNumber value={value} formatAsINR={formatAsINR} />
          {suffix}
        </span>
      </div>

      {(trend !== undefined || trendLabel) && (
        <div className="flex items-center gap-1.5 text-xs mt-1">
          {trend !== undefined && (
            <span
              className={cn(
                "font-medium",
                isPositive ? "text-success" : isNegative ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {isPositive ? "+" : ""}
              {trend}%
            </span>
          )}
          {trendLabel && <span className="text-muted-foreground/70">{trendLabel}</span>}
        </div>
      )}
    </GlassCard>
  )
}
