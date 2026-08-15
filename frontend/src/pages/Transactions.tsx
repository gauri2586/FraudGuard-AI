import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Eye, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { GlassCard } from "@/components/ui/GlassCard"
import { Button } from "@/components/ui/button"
import { RiskBadge, RiskLevel } from "@/components/ui/RiskBadge"
import { StatusBadge, StatusType } from "@/components/ui/StatusBadge"
import { TransactionFilters } from "@/components/transactions/TransactionFilters"
import { TransactionDrawer } from "@/components/transactions/TransactionDrawer"
import { TransactionMobileCard } from "@/components/transactions/TransactionMobileCard"
import { TransactionDetail } from "@/data/mockTransactions"
import { getTransactions } from "@/services/api"
import { containerVariants, itemVariants } from "@/lib/animations"
import { ToastContainer, ToastProps } from "@/components/ui/Toast"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTx, setSelectedTx] = useState<TransactionDetail | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const itemsPerPage = 5
  
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = (toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }
  
  const [filters, setFilters] = useState({
    risk: "all",
    status: "all",
    type: "all",
    date: "all"
  })

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getTransactions()
      
      // If we get an empty array or error, use fallback logic.
      if (!Array.isArray(data) || data.length === 0) {
        setTransactions([])
        return
      }
      
      // Map backend TransactionResponse to frontend TransactionDetail
      const mapped: TransactionDetail[] = data.map((tx: any) => ({
        id: tx.id,
        user: tx.user,
        amount: tx.amount,
        merchant: tx.merchant,
        location: tx.location || "Online",
        device: tx.device,
        timestamp: tx.timestamp,
        riskScore: tx.riskScore,
        status: tx.status,
        type: tx.type,
        aiConfidence: tx.aiConfidence,
        models: tx.modelScores, // For backwards compatibility
        modelScores: tx.modelScores,
        anomalyIndicators: [],
        behavioralIndicators: [],
        explanation: "Dynamic SHAP analysis", // Fallback string
        explanations: tx.explanations || [],
        reasons: tx.reasons || [],
        ipAddress: "192.168.1.1",
        historyCount: 15
      }))
      
      setTransactions(mapped)
    } catch (error) {
      console.error("Failed to load transactions", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const filteredData = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = 
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        tx.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.merchant.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchStatus = filters.status === "all" || tx.status === filters.status
      const matchType = filters.type === "all" || tx.type === filters.type
      
      let matchRisk = true
      if (filters.risk !== "all") {
        const riskLevel = tx.riskScore <= 30 ? "low" : tx.riskScore <= 60 ? "medium" : tx.riskScore <= 80 ? "high" : "critical"
        matchRisk = riskLevel === filters.risk
      }

      return matchSearch && matchStatus && matchType && matchRisk
    })
  }, [searchTerm, filters, transactions])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  const currentData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const openInvestigation = (tx: TransactionDetail) => {
    setSelectedTx(tx)
    setDrawerOpen(true)
  }

  const getRiskLevel = (score: number): RiskLevel => {
    if (score <= 30) return "low"
    if (score <= 60) return "medium"
    if (score <= 80) return "high"
    return "critical"
  }

  const handleAction = (action: string) => {
    if (action === "mark_safe") {
      addToast({
        title: "Transaction marked as safe",
        description: `Transaction ${selectedTx?.id} has been marked as safe.`,
        type: "success",
        onClose: removeToast
      })
      setDrawerOpen(false)
    } else if (action === "block_user") {
      addToast({
        title: "User blocked",
        description: `User ${selectedTx?.user} has been blocked successfully.`,
        type: "error",
        onClose: removeToast
      })
      setDrawerOpen(false)
    }
  }

  return (
    <motion.div 
      className="p-4 md:p-6 lg:p-8 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Transaction Monitoring" 
          description="Review and investigate live financial activities."
        />
        <Button onClick={loadData} disabled={isLoading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <motion.div variants={itemVariants}>
        <TransactionFilters 
          onSearch={setSearchTerm} 
          onFilterChange={handleFilterChange} 
        />
      </motion.div>

      {/* Desktop Table View */}
      <motion.div variants={itemVariants} className="hidden md:block">
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="text-xs text-muted-foreground uppercase bg-background/50 border-b border-border/50">
                <tr>
                  <th className="px-4 py-4 font-medium">Transaction ID</th>
                  <th className="px-4 py-4 font-medium">User</th>
                  <th className="px-4 py-4 font-medium">Amount</th>
                  <th className="px-4 py-4 font-medium">Merchant / Location</th>
                  <th className="px-4 py-4 font-medium">Time</th>
                  <th className="px-4 py-4 font-medium text-center">Risk Score</th>
                  <th className="px-4 py-4 font-medium">Status</th>
                  <th className="px-4 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      Loading live transactions...
                    </td>
                  </tr>
                ) : currentData.length > 0 ? currentData.map((tx, idx) => (
                  <motion.tr 
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors group cursor-pointer"
                    onClick={() => openInvestigation(tx)}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{tx.id}</td>
                    <td className="px-4 py-3">
                      <div>{tx.user}</div>
                      <div className="text-xs text-muted-foreground">{tx.device}</div>
                    </td>
                    <td className="px-4 py-3 font-bold">₹{tx.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="truncate max-w-[150px]" title={tx.merchant}>{tx.merchant}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">{tx.location}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{tx.timestamp}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold">{tx.riskScore}</span>
                        <RiskBadge level={getRiskLevel(tx.riskScore)} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={tx.status as StatusType} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      No transactions found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border/50 bg-background/30">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredData.length)} of {filteredData.length} entries
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Mobile Card View */}
      <motion.div variants={itemVariants} className="md:hidden">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground bg-card rounded-xl border border-border/50">
            Loading...
          </div>
        ) : currentData.length > 0 ? (
          currentData.map(tx => (
            <TransactionMobileCard 
              key={tx.id} 
              transaction={tx} 
              onClick={() => openInvestigation(tx)} 
            />
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground bg-card rounded-xl border border-border/50">
            No transactions found.
          </div>
        )}
        
        {/* Mobile Pagination */}
        {filteredData.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground text-center">
              Page {page} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </motion.div>

      <TransactionDrawer 
        transaction={selectedTx} 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        onAction={handleAction}
      />
      
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </motion.div>
  )
}
