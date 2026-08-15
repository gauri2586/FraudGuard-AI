import * as React from "react"
import { cn } from "@/lib/utils"

export type StatusType = 
  | "approved" 
  | "declined" 
  | "review" 
  | "new" 
  | "investigating" 
  | "confirmed_fraud" 
  | "false_positive" 
  | "resolved"

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize whitespace-nowrap",
        {
          "bg-success/20 text-success": status === "approved" || status === "resolved",
          "bg-destructive/20 text-destructive": status === "declined" || status === "confirmed_fraud",
          "bg-warning/20 text-warning": status === "review" || status === "investigating",
          "bg-primary/20 text-primary": status === "new",
          "bg-muted text-muted-foreground": status === "false_positive",
        },
        className
      )}
      {...props}
    >
      {status.replace("_", " ")}
    </span>
  )
}
