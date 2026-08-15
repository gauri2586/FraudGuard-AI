import { Variants } from "framer-motion"

// Consistent professional easing (ease-out-quart equivalent)
export const EASE = [0.25, 1, 0.5, 1]

export const TRANSITION = {
  duration: 0.25,
  ease: EASE,
}

export const SPRING_TRANSITION = {
  type: "spring",
  stiffness: 500,
  damping: 35,
}

// Container staggered entrance
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

// Standard vertical slide-up entrance (used for cards, table rows)
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: TRANSITION },
}

// Horizontal slide-in (e.g., from left)
export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: TRANSITION },
}

// Scale-in (used for alerts, badges)
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: TRANSITION },
}

// Simple fade
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: TRANSITION },
}

// Hover & Press interactions (for buttons, cards)
export const interactionVariants = {
  hover: { 
    y: -2, 
    transition: { duration: 0.2, ease: "easeOut" } 
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  },
}

// Modal transitions
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: TRANSITION },
  exit: { opacity: 0, scale: 0.98, y: 10, transition: { duration: 0.15, ease: "easeIn" } },
}

// Toast transitions
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRING_TRANSITION },
  exit: { opacity: 0, y: 10, scale: 0.9, transition: { duration: 0.2 } },
}

// Tab indicator layout transition
export const tabTransition = SPRING_TRANSITION
