import { StatusType } from "../components/ui/StatusBadge"

export type AlertSeverity = "critical" | "high" | "medium"

export interface FraudAlert {
  id: string
  transactionId: string
  user: string
  amount: number
  riskScore: number
  time: string
  severity: AlertSeverity
  status: StatusType
  reasons: string[]
  assignedTo?: string
  notes?: string
}

export const MOCK_ALERTS: FraudAlert[] = [
  {
    id: "ALT-8890",
    transactionId: "TX-100452",
    user: "Alice Smith",
    amount: 12500.00,
    riskScore: 92,
    time: "2023-10-25 14:32:00",
    severity: "critical",
    status: "new",
    reasons: [
      "Amount 50x higher than average",
      "Velocity anomaly (3 high-value TXs in 1hr)",
      "Unrecognized device"
    ]
  },
  {
    id: "ALT-8891",
    transactionId: "TX-100457",
    user: "Frank Castle",
    amount: 4500.00,
    riskScore: 85,
    time: "2023-10-25 15:10:00",
    severity: "critical",
    status: "investigating",
    assignedTo: "Jane Doe",
    reasons: [
      "Multiple failed CVV attempts",
      "Account takeover suspected",
      "Bot-like interaction detected"
    ]
  },
  {
    id: "ALT-8892",
    transactionId: "TX-100454",
    user: "Charlie Davis",
    amount: 3400.00,
    riskScore: 75,
    time: "2023-10-25 14:40:05",
    severity: "high",
    status: "new",
    reasons: [
      "High volume crypto purchase",
      "Active VPN usage"
    ]
  },
  {
    id: "ALT-8893",
    transactionId: "TX-100420",
    user: "Olivia Rodrigo",
    amount: 890.50,
    riskScore: 68,
    time: "2023-10-25 12:15:00",
    severity: "high",
    status: "confirmed_fraud",
    assignedTo: "System",
    reasons: [
      "Stolen credit card reported",
      "Distance velocity impossible (travel speed)"
    ],
    notes: "User confirmed card was stolen. Blocked."
  },
  {
    id: "ALT-8894",
    transactionId: "TX-100411",
    user: "Mark Z",
    amount: 55.00,
    riskScore: 42,
    time: "2023-10-25 11:30:22",
    severity: "medium",
    status: "false_positive",
    reasons: [
      "Shipping address mismatch"
    ],
    notes: "User recently moved, updated address on file."
  },
  {
    id: "ALT-8895",
    transactionId: "TX-100499",
    user: "Elena Gilbert",
    amount: 2500.00,
    riskScore: 95,
    time: "2023-10-25 16:45:11",
    severity: "critical",
    status: "new",
    reasons: [
      "New device login from high-risk country",
      "Immediate wire transfer post-login",
      "Password reset within last 24hrs"
    ]
  }
]
