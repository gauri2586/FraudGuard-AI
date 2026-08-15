import * as React from "react"
import { motion } from "framer-motion"
import { TransactionDetail } from "@/data/mockTransactions"
import { RiskBadge, RiskLevel } from "../ui/RiskBadge"
import { StatusBadge, StatusType } from "../ui/StatusBadge"
import { GlassCard } from "../ui/GlassCard"
import { MapPin, Smartphone, Clock, ShieldAlert } from "lucide-react"

interface TransactionMobileCardProps {
  transaction: TransactionDetail
  onClick: () => void
}

export function TransactionMobileCard({ transaction, onClick }: TransactionMobileCardProps) {
  const getRiskLevel = (score: number): RiskLevel => {
    if (score <= 30) return "low"
    if (score <= 60) return "medium"
    if (score <= 80) return "high"
    return "critical"
  }

  return (
    <GlassCard interactive onClick={onClick} className="p-4 cursor-pointer mb-3 last:mb-0">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-semibold text-foreground text-base">{transaction.user}</div>
          <div className="text-xs text-muted-foreground">{transaction.id}</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg">₹{transaction.amount.toFixed(2)}</div>
          <StatusBadge status={transaction.status as StatusType} className="mt-1" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-muted-foreground mt-4 pb-4 border-b border-border/50">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{transaction.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Smartphone className="h-3.5 w-3.5" />
          <span className="truncate">{transaction.device}</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>{transaction.timestamp}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-3">
        <div className="text-xs font-medium text-muted-foreground">{transaction.merchant}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Risk Score:</span>
          <RiskBadge level={getRiskLevel(transaction.riskScore)} />
        </div>
      </div>
    </GlassCard>
  )
}
