export type TimePeriod = "7d" | "30d" | "90d" | "1y"

export interface AnalyticsData {
  period: TimePeriod
  summary: {
    avgAmount: number
    fraudAmount: number
    fraudRate: number
    totalVolume: number
  }
  timeSeriesData: { date: string; volume: number; fraudRate: number; suspicious: number }[]
  fraudByType: { name: string; value: number }[]
  fraudByLocation: { name: string; value: number }[]
  fraudByCategory: { name: string; value: number }[]
  riskDistribution: { name: string; count: number }[]
  modelPerformance: { metric: string; value: number }[]
}

const generateTimeSeries = (days: number, volatility: number, volumeBase: number) => {
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - i - 1))
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    // Some random walk logic
    const volume = Math.floor(volumeBase + Math.random() * volatility * 100)
    const fraudRate = Number((0.5 + Math.random() * volatility * 2).toFixed(2))
    const suspicious = Math.floor(volume * (Math.random() * 0.15))

    return { date: dateStr, volume, fraudRate, suspicious }
  })
}

export const getMockAnalytics = (period: TimePeriod): AnalyticsData => {
  let days = 7
  let volBase = 1200
  let volatility = 1.2
  
  if (period === "30d") { days = 30; volBase = 4000; volatility = 2.0; }
  if (period === "90d") { days = 12; volBase = 12000; volatility = 2.5; } // Sample down for 90d to 12 weeks
  if (period === "1y") { days = 12; volBase = 45000; volatility = 3.5; } // Sample down to 12 months

  const timeSeriesData = generateTimeSeries(days, volatility, volBase)
  
  const totalVolume = timeSeriesData.reduce((acc, curr) => acc + curr.volume, 0)
  const avgFraudRate = timeSeriesData.reduce((acc, curr) => acc + curr.fraudRate, 0) / days

  return {
    period,
    summary: {
      avgAmount: 145.20 * (1 + (Math.random() * 0.2 - 0.1)), // Slight random variance
      fraudAmount: totalVolume * 145.20 * (avgFraudRate / 100),
      fraudRate: avgFraudRate,
      totalVolume: totalVolume
    },
    timeSeriesData,
    fraudByType: [
      { name: "Wire Transfer", value: 45 + Math.random() * 20 },
      { name: "Credit Card", value: 30 + Math.random() * 10 },
      { name: "Crypto", value: 15 + Math.random() * 10 },
      { name: "Digital Wallet", value: 10 + Math.random() * 5 },
    ],
    fraudByLocation: [
      { name: "Eastern Europe", value: 35 + Math.random() * 10 },
      { name: "North America", value: 25 + Math.random() * 10 },
      { name: "Asia Pacific", value: 20 + Math.random() * 10 },
      { name: "South America", value: 15 + Math.random() * 10 },
      { name: "Other", value: 5 },
    ],
    fraudByCategory: [
      { name: "Electronics", value: 85 + Math.random() * 20 },
      { name: "Luxury Goods", value: 65 + Math.random() * 10 },
      { name: "Crypto Services", value: 55 + Math.random() * 10 },
      { name: "Digital Goods", value: 45 + Math.random() * 10 },
      { name: "Travel", value: 30 + Math.random() * 10 },
    ],
    riskDistribution: [
      { name: "0-20", count: Math.floor(totalVolume * 0.7) },
      { name: "21-40", count: Math.floor(totalVolume * 0.15) },
      { name: "41-60", count: Math.floor(totalVolume * 0.08) },
      { name: "61-80", count: Math.floor(totalVolume * 0.05) },
      { name: "81-100", count: Math.floor(totalVolume * 0.02) },
    ],
    modelPerformance: [
      { metric: "Precision", value: 94.2 + (Math.random() * 2 - 1) },
      { metric: "Recall", value: 89.5 + (Math.random() * 2 - 1) },
      { metric: "F1 Score", value: 91.8 + (Math.random() * 2 - 1) },
      { metric: "AUC-ROC", value: 97.5 + (Math.random() * 1 - 0.5) },
    ]
  }
}
