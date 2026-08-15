export const KPI_DATA = {
  totalTransactions: 124500,
  fraudDetected: 342,
  suspicious: 1205,
  moneyAtRisk: 4250000,
}

export const TREND_DATA = [
  { name: "Mon", fraud: 40, suspicious: 120 },
  { name: "Tue", fraud: 30, suspicious: 98 },
  { name: "Wed", fraud: 45, suspicious: 140 },
  { name: "Thu", fraud: 25, suspicious: 85 },
  { name: "Fri", fraud: 60, suspicious: 190 },
  { name: "Sat", fraud: 35, suspicious: 110 },
  { name: "Sun", fraud: 50, suspicious: 160 },
]

export const VOLUME_DATA = [
  { time: "00:00", volume: 1200 },
  { time: "04:00", volume: 800 },
  { time: "08:00", volume: 3400 },
  { time: "12:00", volume: 5600 },
  { time: "16:00", volume: 4800 },
  { time: "20:00", volume: 2900 },
  { time: "23:59", volume: 1500 },
]

export const DISTRIBUTION_DATA = [
  { name: "Credit Card", value: 45 },
  { name: "Bank Transfer", value: 30 },
  { name: "Crypto", value: 15 },
  { name: "Digital Wallet", value: 10 },
]

export const RECENT_TRANSACTIONS = [
  { id: "TX-99321", user: "Alice Smith", amount: 12500.00, type: "Wire Transfer", risk: "critical", date: "2 mins ago" },
  { id: "TX-99320", user: "Bob Johnson", amount: 45.00, type: "Credit Card", risk: "low", date: "5 mins ago" },
  { id: "TX-99319", user: "Charlie Davis", amount: 3400.00, type: "Crypto", risk: "high", date: "12 mins ago" },
  { id: "TX-99318", user: "Diana Prince", amount: 150.00, type: "Digital Wallet", risk: "low", date: "15 mins ago" },
  { id: "TX-99317", user: "Evan Wright", amount: 890.00, type: "Bank Transfer", risk: "medium", date: "22 mins ago" },
]

export const ACTIVE_ALERTS = [
  { id: 1, title: "Multiple logins detected", user: "usr_5992", severity: "high", time: "10m ago" },
  { id: 2, title: "Unusual location transfer", user: "usr_1024", severity: "critical", time: "1h ago" },
  { id: 3, title: "Velocity check failed", user: "usr_8831", severity: "medium", time: "3h ago" },
]

export const ACTIVITY_TIMELINE = [
  { id: 1, action: "Model retraining completed", type: "system", time: "08:00 AM" },
  { id: 2, action: "Ruleset 'Crypto_High_Risk' updated", type: "user", user: "Admin", time: "09:30 AM" },
  { id: 3, action: "API latency spike detected", type: "alert", time: "11:15 AM" },
  { id: 4, action: "Fraud analyst viewed TX-99321", type: "user", user: "J.Doe", time: "12:05 PM" },
]
