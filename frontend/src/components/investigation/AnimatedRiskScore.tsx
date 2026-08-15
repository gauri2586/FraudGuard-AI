import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { AlertOctagon, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react"

interface AnimatedRiskScoreProps {
  score: number
}

export function AnimatedRiskScore({ score }: AnimatedRiskScoreProps) {
  const [displayScore, setDisplayScore] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayScore(score)
      return
    }

    let startTime: number
    const duration = 300 // 300ms fast

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // Easing function: easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4)
      
      setDisplayScore(Math.floor(easeProgress * score))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [score, prefersReducedMotion])

  const isCritical = score > 80
  const isHigh = score > 60 && score <= 80
  const isMedium = score > 30 && score <= 60
  
  const colorClass = isCritical 
    ? "text-destructive" 
    : isHigh ? "text-orange-500" 
    : isMedium ? "text-warning" : "text-success"

  const bgGlow = isCritical 
    ? "shadow-[0_0_50px_rgba(239,68,68,0.2)]" 
    : isHigh ? "shadow-[0_0_50px_rgba(249,115,22,0.2)]" 
    : isMedium ? "shadow-[0_0_50px_rgba(234,179,8,0.2)]" : "shadow-[0_0_50px_rgba(34,197,94,0.2)]"

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className={`relative flex items-center justify-center w-48 h-48 rounded-full border-4 border-background bg-card ${bgGlow} mb-6`}
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="46%"
            fill="transparent"
            stroke="hsl(var(--border))"
            strokeWidth="8"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="46%"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={colorClass}
            initial={{ strokeDasharray: "0 1000" }}
            animate={{ strokeDasharray: `${(displayScore / 100) * 289} 1000` }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: "easeOut" }}
          />
        </svg>
        <div className="flex flex-col items-center z-10">
          <span className={`text-6xl font-bold tracking-tighter ${colorClass}`}>
            {displayScore}<span className="text-3xl">%</span>
          </span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">Risk Score</span>
        </div>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest ${
          isCritical ? "bg-destructive/20 text-destructive" :
          isHigh ? "bg-orange-500/20 text-orange-500" :
          isMedium ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
        }`}
      >
        {isCritical && <AlertOctagon className="h-5 w-5" />}
        {isHigh && <AlertTriangle className="h-5 w-5" />}
        {isMedium && <ShieldAlert className="h-5 w-5" />}
        {!isCritical && !isHigh && !isMedium && <ShieldCheck className="h-5 w-5" />}
        
        {isCritical ? "Critical Risk" :
         isHigh ? "High Risk" :
         isMedium ? "Medium Risk" : "Low Risk"}
      </motion.div>
    </div>
  )
}
