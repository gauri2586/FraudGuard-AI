import { useState, useEffect } from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Shield, 
  LayoutDashboard, 
  Activity, 
  ShieldAlert, 
  Users, 
  FileSearch, 
  LineChart, 
  Network, 
  Settings, 
  Menu, 
  X, 
  Bell, 
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/ui/UserMenu"
import { cn } from "@/lib/utils"
import { checkBackendHealth } from "@/services/api"
import { ErrorBoundary } from "@/components/ErrorBoundary"

const navLinks = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Demo Simulator", path: "/simulator", icon: Zap },
  { name: "Transactions", path: "/transactions", icon: Activity },
  { name: "Fraud Alerts", path: "/alerts", icon: ShieldAlert },
  { name: "User Risk", path: "/risk", icon: Users },
  { name: "AI Investigation", path: "/investigation", icon: FileSearch },
  { name: "Analytics", path: "/analytics", icon: LineChart },
  { name: "Model Performance", path: "/performance", icon: Network },
  { name: "Settings", path: "/settings", icon: Settings },
]

export default function DashboardLayout() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "offline">("checking")

  // Check backend health on mount
  useEffect(() => {
    let mounted = true
    const checkStatus = async () => {
      const isHealthy = await checkBackendHealth()
      if (mounted) {
        setBackendStatus(isHealthy ? "connected" : "offline")
      }
    }
    checkStatus()
    
    // Poll every 10 seconds
    const interval = setInterval(checkStatus, 10000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const LogoArea = ({ collapsed }: { collapsed?: boolean }) => (
    <div className={cn("flex h-16 items-center px-4", collapsed ? "justify-center" : "gap-3")}>
      <div className="relative flex items-center justify-center">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-card border border-border shadow-sm">
          <BrainCircuit className="h-4 w-4 text-primary" />
        </div>
      </div>
      {!collapsed && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col overflow-hidden whitespace-nowrap"
        >
          <span className="text-base font-bold leading-tight tracking-tight text-foreground">FraudGuard AI</span>
          <span className="text-[10px] font-semibold tracking-widest text-primary uppercase leading-tight">FRAUD INTELLIGENCE PLATFORM</span>
        </motion.div>
      )}
    </div>
  )

  return (
    <div className="flex min-h-screen w-full flex-col bg-background overflow-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden -ml-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open Navigation Menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="md:hidden">
            <LogoArea />
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/50 text-xs font-medium mr-2">
            <span className="relative flex h-2.5 w-2.5">
              {backendStatus === "checking" && <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-muted-foreground opacity-75"></span>}
              {backendStatus === "connected" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-20"></span>}
              <span className={cn(
                "relative inline-flex rounded-full h-2.5 w-2.5",
                backendStatus === "connected" ? "bg-success" : backendStatus === "offline" ? "bg-destructive" : "bg-muted-foreground"
              )}></span>
            </span>
            <span className="text-muted-foreground">
              {backendStatus === "connected" ? "AI Backend Connected" : backendStatus === "offline" ? "Backend Offline" : "Checking Backend..."}
            </span>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-muted-foreground hover:text-foreground"
            onClick={() => alert("No new notifications")}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-pulse" />
          </Button>
          <UserMenu />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: desktopCollapsed ? "4.5rem" : "16rem" }}
          className="hidden md:flex flex-col border-r border-border/50 bg-card/30 backdrop-blur-sm z-20 shrink-0 relative transition-all duration-300 ease-in-out"
        >
          <LogoArea collapsed={desktopCollapsed} />
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar">
            <nav className="flex flex-col gap-1 px-2">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.path
                
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="relative outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md group"
                    title={desktopCollapsed ? link.name : undefined}
                  >
                    <div className={cn(
                      "flex items-center h-9 px-3 rounded-md transition-all duration-200 border-l-2",
                      isActive 
                        ? "bg-primary/10 text-primary border-primary shadow-[inset_2px_0_0_0_hsl(var(--primary))]" 
                        : "border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}>
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "group-hover:text-foreground transition-colors")} />
                      
                      <AnimatePresence mode="wait">
                        {!desktopCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden"
                          >
                            {link.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Collapse Toggle Button */}
          <div className="p-3 border-t border-border/50 flex justify-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setDesktopCollapsed(!desktopCollapsed)}
              className={cn("w-full text-muted-foreground hover:text-foreground", desktopCollapsed ? "px-0" : "")}
              aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {desktopCollapsed ? <ChevronRight className="h-5 w-5" /> : (
                <div className="flex items-center w-full">
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  <span className="text-xs">Collapse</span>
                </div>
              )}
            </Button>
          </div>
        </motion.aside>

        {/* Mobile Slide-in Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
              />
              
              {/* Drawer */}
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border/50 shadow-2xl flex flex-col md:hidden"
              >
                <div className="flex h-16 items-center justify-between px-4 border-b border-border/50">
                  <LogoArea />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close Navigation Menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon
                    const isActive = location.pathname === link.path
                    
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative outline-none focus-visible:ring-2 focus-visible:ring-primary border-l-2",
                          isActive
                            ? "bg-primary/10 text-primary border-primary shadow-[inset_2px_0_0_0_hsl(var(--primary))]"
                            : "border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
                        {link.name}
                      </Link>
                    )
                  })}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background/50 custom-scrollbar">
          <div className="mx-auto max-w-7xl w-full">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
