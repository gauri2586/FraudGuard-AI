import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { interactionVariants } from "@/lib/animations"

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  interactive?: boolean;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, interactive = false, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={interactive ? interactionVariants : undefined}
        whileHover={interactive ? "hover" : undefined}
        className={cn(
          "glass-card rounded-xl p-5 relative overflow-hidden",
          className
        )}
        {...props}
      >
        <div className="relative z-10">{children}</div>
      </motion.div>
    )
  }
)
GlassCard.displayName = "GlassCard"

export { GlassCard }
