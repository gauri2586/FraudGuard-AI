import { useState, useRef, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { User, Settings, HelpCircle, LogOut, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick)
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  const menuItems = [
    { name: "Profile", path: "/profile", icon: User },
    { name: "Settings", path: "/settings", icon: Settings },
    { name: "Help & Documentation", path: "/help", icon: HelpCircle },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-full md:rounded-lg md:border md:border-border/50 md:bg-card/50 md:py-1 md:pl-1 md:pr-2.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ml-2",
          isOpen ? "md:bg-secondary/10" : "hover:md:bg-secondary/10 hover:md:border-border"
        )}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium border border-border/50 shrink-0">
          AM
        </div>
        <div className="hidden md:flex flex-col items-start text-left max-w-[120px]">
          <span className="text-sm font-medium leading-none text-foreground truncate w-full">Alex Morgan</span>
          <span className="text-[10px] text-muted-foreground mt-1 truncate w-full">Senior Fraud Analyst</span>
        </div>
        <ChevronDown className={cn("hidden md:block h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 rounded-md border border-border/50 bg-card/95 backdrop-blur-md shadow-xl z-50 overflow-hidden origin-top-right"
          >
            <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
              <p className="text-sm font-medium text-foreground">Alex Morgan</p>
              <p className="text-xs text-muted-foreground truncate">alex.morgan@fraudguard.demo</p>
            </div>
            
            <div className="py-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm transition-colors outline-none focus-visible:bg-secondary/50",
                      isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                    role="menuitem"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
            
            <div className="py-1 border-t border-border/50">
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to sign out? (Demo)")) {
                    console.log("Signed out")
                  }
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors outline-none focus-visible:bg-destructive/10"
                role="menuitem"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
