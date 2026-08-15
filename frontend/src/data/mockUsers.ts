export interface UserProfile {
  id: string
  name: string
  email: string
  riskScore: number
  status: "active" | "monitored" | "blocked"
  joinedDate: string
  
  // Aggregate Stats
  txCount: number
  avgAmount: number
  suspiciousCount: number
  fraudHistory: number
  
  // Typical Behavior
  typicalLocations: string[]
  typicalDevices: string[]
  typicalTimes: string[]
  
  // Insights
  normalBehavior: string[]
  detectedDeviations: string[]
  
  // Chart Data
  recentTransactions: { id: string; date: string; amount: number; risk: number }[]
  riskTrend: { date: string; score: number }[]
  spendingByCategory: { category: string; amount: number }[]
  timeOfDay: { hour: string; count: number }[]
}

export const MOCK_USERS: UserProfile[] = [
  {
    id: "USR-9921",
    name: "Frank Castle",
    email: "frank.c@example.com",
    riskScore: 92,
    status: "blocked",
    joinedDate: "2021-03-15",
    txCount: 145,
    avgAmount: 120.50,
    suspiciousCount: 8,
    fraudHistory: 2,
    typicalLocations: ["New York, US", "Miami, US"],
    typicalDevices: ["iPhone 12", "MacBook Air"],
    typicalTimes: ["Evening (6PM-10PM)"],
    normalBehavior: [
      "Consistent purchases at local grocery stores",
      "Average transaction amount strictly under ₹200",
      "Transactions originate exclusively from US IP addresses"
    ],
    detectedDeviations: [
      "Sudden surge of ₹4,500+ transactions at high-risk merchants",
      "Geographic velocity impossible (NY to Russia in 1 hour)",
      "New, unrecognized Android device added to account",
      "Mouse/typing biometric signatures do not match historical profile"
    ],
    recentTransactions: [
      { id: "TX-100457", date: "2023-10-25", amount: 4500.00, risk: 95 },
      { id: "TX-100456", date: "2023-10-24", amount: 12.50, risk: 10 },
      { id: "TX-100455", date: "2023-10-23", amount: 89.99, risk: 15 },
    ],
    riskTrend: [
      { date: "Oct 20", score: 15 },
      { date: "Oct 21", score: 12 },
      { date: "Oct 22", score: 14 },
      { date: "Oct 23", score: 15 },
      { date: "Oct 24", score: 18 },
      { date: "Oct 25", score: 92 },
    ],
    spendingByCategory: [
      { category: "Groceries", amount: 450 },
      { category: "Dining", amount: 320 },
      { category: "Entertainment", amount: 150 },
      { category: "Electronics", amount: 4500 }, // Anomaly
      { category: "Travel", amount: 0 },
    ],
    timeOfDay: [
      { hour: "00:00", count: 0 }, { hour: "06:00", count: 2 },
      { hour: "12:00", count: 15 }, { hour: "18:00", count: 45 },
      { hour: "23:00", count: 25 },
    ]
  },
  {
    id: "USR-4412",
    name: "Charlie Davis",
    email: "charlie.d@example.com",
    riskScore: 75,
    status: "monitored",
    joinedDate: "2022-11-02",
    txCount: 38,
    avgAmount: 450.00,
    suspiciousCount: 3,
    fraudHistory: 0,
    typicalLocations: ["London, UK"],
    typicalDevices: ["MacBook Pro"],
    typicalTimes: ["Morning (8AM-11AM)"],
    normalBehavior: [
      "Software subscriptions and cloud services",
      "Transactions from static residential IP",
      "Very low velocity (1-2 transactions per week)"
    ],
    detectedDeviations: [
      "Large crypto exchange purchase (₹3,400)",
      "VPN usage detected matching a known commercial VPN exit node",
      "Transaction outside normal timezone hours"
    ],
    recentTransactions: [
      { id: "TX-100454", date: "2023-10-25", amount: 3400.00, risk: 75 },
      { id: "TX-100422", date: "2023-10-18", amount: 45.00, risk: 5 },
      { id: "TX-100390", date: "2023-10-10", amount: 120.00, risk: 10 },
    ],
    riskTrend: [
      { date: "Oct 20", score: 10 },
      { date: "Oct 21", score: 12 },
      { date: "Oct 22", score: 11 },
      { date: "Oct 23", score: 10 },
      { date: "Oct 24", score: 15 },
      { date: "Oct 25", score: 75 },
    ],
    spendingByCategory: [
      { category: "Software", amount: 850 },
      { category: "Crypto", amount: 3400 }, // Anomaly
      { category: "Dining", amount: 120 },
      { category: "Utilities", amount: 250 },
      { category: "Travel", amount: 0 },
    ],
    timeOfDay: [
      { hour: "00:00", count: 12 }, // Anomaly
      { hour: "06:00", count: 35 },
      { hour: "12:00", count: 5 }, 
      { hour: "18:00", count: 2 },
      { hour: "23:00", count: 0 },
    ]
  },
  {
    id: "USR-1084",
    name: "Alice Smith",
    email: "alice.smith@example.com",
    riskScore: 12,
    status: "active",
    joinedDate: "2019-05-20",
    txCount: 842,
    avgAmount: 65.20,
    suspiciousCount: 0,
    fraudHistory: 0,
    typicalLocations: ["Seattle, US", "Portland, US"],
    typicalDevices: ["iPhone 13", "iPad Air"],
    typicalTimes: ["Afternoon (1PM-5PM)"],
    normalBehavior: [
      "Frequent small purchases at coffee shops and retail",
      "Predictable geolocation patterns (Pacific Northwest)",
      "Consistent device usage for 2+ years"
    ],
    detectedDeviations: [
      "None. User behavior aligns perfectly with historical patterns."
    ],
    recentTransactions: [
      { id: "TX-100488", date: "2023-10-25", amount: 12.50, risk: 2 },
      { id: "TX-100481", date: "2023-10-24", amount: 150.00, risk: 5 },
      { id: "TX-100472", date: "2023-10-23", amount: 8.99, risk: 1 },
    ],
    riskTrend: [
      { date: "Oct 20", score: 15 },
      { date: "Oct 21", score: 12 },
      { date: "Oct 22", score: 10 },
      { date: "Oct 23", score: 14 },
      { date: "Oct 24", score: 11 },
      { date: "Oct 25", score: 12 },
    ],
    spendingByCategory: [
      { category: "Groceries", amount: 650 },
      { category: "Dining", amount: 420 },
      { category: "Retail", amount: 380 },
      { category: "Utilities", amount: 150 },
      { category: "Travel", amount: 200 },
    ],
    timeOfDay: [
      { hour: "00:00", count: 2 }, 
      { hour: "06:00", count: 15 },
      { hour: "12:00", count: 65 }, 
      { hour: "18:00", count: 42 },
      { hour: "23:00", count: 5 },
    ]
  }
]
