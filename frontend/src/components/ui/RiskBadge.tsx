import { Badge, BadgeProps } from "./badge"
import { cn } from "@/lib/utils"

export type RiskLevel = "low" | "medium" | "high" | "critical"

interface RiskBadgeProps extends Omit<BadgeProps, "variant"> {
  level: RiskLevel
}

export function RiskBadge({ level, className, ...props }: RiskBadgeProps) {
  return (
    <Badge
      className={cn(
        "px-2.5 py-0.5 text-xs font-semibold capitalize border",
        {
          "bg-success/10 text-success border-success/20 hover:bg-success/20": level === "low",
          "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20": level === "medium",
          "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20": level === "high",
          "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90 animate-pulse": level === "critical",
        },
        className
      )}
      {...props}
    >
      {level} Risk
    </Badge>
  )
}
