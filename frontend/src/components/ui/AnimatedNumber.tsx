import { useEffect, useState } from "react"
import { motion, useSpring, useTransform, useReducedMotion } from "framer-motion"

import { formatINR } from "@/lib/utils"

interface AnimatedNumberProps {
  value: number
  duration?: number
  formatAsINR?: boolean
}

export function AnimatedNumber({ value, duration = 300, formatAsINR = false }: AnimatedNumberProps) {
  const [isClient, setIsClient] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  const spring = useSpring(0, {
    bounce: 0,
    duration: prefersReducedMotion ? 0 : duration,
  })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  const display = useTransform(spring, (current) =>
    formatAsINR ? formatINR(Math.round(current)) : Math.round(current).toLocaleString('en-IN')
  )

  if (!isClient) return <span>{formatAsINR ? formatINR(value) : value.toLocaleString('en-IN')}</span>

  return <motion.span>{display}</motion.span>
}
