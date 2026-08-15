import * as React from "react"
import { Search, Filter, SlidersHorizontal } from "lucide-react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

interface TransactionFiltersProps {
  onSearch: (term: string) => void
  onFilterChange: (key: string, value: string) => void
}

export function TransactionFilters({ onSearch, onFilterChange }: TransactionFiltersProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by ID, User, or Merchant..." 
            className="pl-9 bg-background/50"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="sm:w-auto w-full gap-2 text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          Advanced Filters
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <select 
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          onChange={(e) => onFilterChange("risk", e.target.value)}
        >
          <option value="all">All Risk Levels</option>
          <option value="critical">Critical (81-100)</option>
          <option value="high">High (61-80)</option>
          <option value="medium">Medium (31-60)</option>
          <option value="low">Low (0-30)</option>
        </select>
        
        <select 
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          onChange={(e) => onFilterChange("status", e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="review">Needs Review</option>
          <option value="declined">Declined</option>
        </select>

        <select 
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          onChange={(e) => onFilterChange("type", e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="Wire Transfer">Wire Transfer</option>
          <option value="Credit Card">Credit Card</option>
          <option value="Crypto">Crypto</option>
          <option value="Digital Wallet">Digital Wallet</option>
        </select>
        
        <select 
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          onChange={(e) => onFilterChange("date", e.target.value)}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>
    </div>
  )
}
