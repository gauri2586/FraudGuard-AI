export type TransactionStatus = "approved" | "declined" | "review"

export interface TransactionDetail {
  id: string
  user: string
  amount: number
  merchant: string
  location: string
  device: string
  timestamp: string
  riskScore: number
  status: TransactionStatus
  type: string
  
  // Investigation details
  modelScores: {
    xgboost: number
    isolationForest: number
    autoencoder: number
  }
  anomalyIndicators: string[]
  behavioralIndicators: string[]
  explanation: string
  explanations?: any[]
}

export const DETAILED_TRANSACTIONS: TransactionDetail[] = [
  {
    id: "TX-100452",
    user: "Alice Smith",
    amount: 12500.00,
    merchant: "Luxury Watches Inc.",
    location: "Moscow, RU",
    device: "Unknown Android",
    timestamp: "2023-10-25 14:32:00",
    riskScore: 92,
    status: "review",
    type: "Wire Transfer",
    modelScores: { xgboost: 94, isolationForest: 88, autoencoder: 90 },
    anomalyIndicators: [
      "Amount 50x higher than user average",
      "Login from new high-risk country",
      "Unrecognized device"
    ],
    behavioralIndicators: [
      "No typical browsing before purchase",
      "Typing speed anomaly detected"
    ],
    explanation: "SHAP values indicate the transaction amount (+35%) and geolocation (+40%) are the primary drivers for the critical risk score."
  },
  {
    id: "TX-100453",
    user: "Bob Johnson",
    amount: 45.50,
    merchant: "Local Coffee Shop",
    location: "New York, US",
    device: "iPhone 13",
    timestamp: "2023-10-25 14:35:12",
    riskScore: 12,
    status: "approved",
    type: "Credit Card",
    modelScores: { xgboost: 10, isolationForest: 15, autoencoder: 8 },
    anomalyIndicators: [],
    behavioralIndicators: [
      "Familiar IP address",
      "Regular purchase time"
    ],
    explanation: "Transaction matches normal user behavior profile. Low risk."
  },
  {
    id: "TX-100454",
    user: "Charlie Davis",
    amount: 3400.00,
    merchant: "Binance Crypto",
    location: "London, UK",
    device: "MacBook Pro",
    timestamp: "2023-10-25 14:40:05",
    riskScore: 75,
    status: "review",
    type: "Crypto",
    modelScores: { xgboost: 72, isolationForest: 80, autoencoder: 68 },
    anomalyIndicators: [
      "High volume crypto purchase",
      "First time at this merchant"
    ],
    behavioralIndicators: [
      "Known device",
      "VPN detected"
    ],
    explanation: "Elevated risk due to combination of large crypto purchase and active VPN usage."
  },
  {
    id: "TX-100455",
    user: "Diana Prince",
    amount: 150.00,
    merchant: "Amazon",
    location: "Seattle, US",
    device: "iPad Air",
    timestamp: "2023-10-25 14:45:22",
    riskScore: 45,
    status: "approved",
    type: "Digital Wallet",
    modelScores: { xgboost: 40, isolationForest: 48, autoencoder: 42 },
    anomalyIndicators: [
      "Shipping address differs from billing"
    ],
    behavioralIndicators: [
      "Normal browsing speed"
    ],
    explanation: "Medium risk flagged due to shipping address mismatch, but within acceptable threshold."
  },
  {
    id: "TX-100456",
    user: "Evan Wright",
    amount: 890.00,
    merchant: "Best Buy",
    location: "Chicago, US",
    device: "Windows PC",
    timestamp: "2023-10-25 15:02:11",
    riskScore: 25,
    status: "approved",
    type: "Credit Card",
    modelScores: { xgboost: 22, isolationForest: 28, autoencoder: 20 },
    anomalyIndicators: [],
    behavioralIndicators: [
      "Historical purchase at merchant"
    ],
    explanation: "Standard electronics purchase. Matches historical category spending."
  },
  {
    id: "TX-100457",
    user: "Frank Castle",
    amount: 4500.00,
    merchant: "GunBroker",
    location: "Miami, US",
    device: "Android Tablet",
    timestamp: "2023-10-25 15:10:00",
    riskScore: 85,
    status: "declined",
    type: "Bank Transfer",
    modelScores: { xgboost: 88, isolationForest: 82, autoencoder: 86 },
    anomalyIndicators: [
      "Velocity of transactions is high",
      "Multiple failed CVV attempts previously"
    ],
    behavioralIndicators: [
      "Mouse movement looks automated (bot)"
    ],
    explanation: "High probability of account takeover. Blocked automatically."
  },
  {
    id: "TX-100458",
    user: "Grace Hopper",
    amount: 12.99,
    merchant: "Netflix",
    location: "San Francisco, US",
    device: "Smart TV",
    timestamp: "2023-10-25 15:15:33",
    riskScore: 5,
    status: "approved",
    type: "Subscription",
    modelScores: { xgboost: 2, isolationForest: 8, autoencoder: 5 },
    anomalyIndicators: [],
    behavioralIndicators: [
      "Recurring monthly charge"
    ],
    explanation: "Known recurring subscription. Safe."
  },
  {
    id: "TX-100459",
    user: "Harry Potter",
    amount: 320.00,
    merchant: "Ollivanders",
    location: "London, UK",
    device: "iPhone 14",
    timestamp: "2023-10-25 15:30:00",
    riskScore: 35,
    status: "approved",
    type: "Debit Card",
    modelScores: { xgboost: 32, isolationForest: 38, autoencoder: 30 },
    anomalyIndicators: [
      "Unusual spending category"
    ],
    behavioralIndicators: [],
    explanation: "Unusual category but low amount and known device. Approved."
  },
]
