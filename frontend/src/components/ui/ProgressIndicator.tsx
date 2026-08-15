import { cn } from "@/lib/utils"

interface ProgressIndicatorProps {
  value: number
  max?: number
  className?: string
  indicatorClassName?: string
  colorClass?: string
}

export function ProgressIndicator({
  value,
  max = 100,
  className,
  indicatorClassName,
  colorClass = "bg-primary"
}: ProgressIndicatorProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary/50",
        className
      )}
    >
      <div
        className={cn(
          "h-full w-full flex-1 transition-all duration-500 ease-in-out",
          colorClass,
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  )
}
