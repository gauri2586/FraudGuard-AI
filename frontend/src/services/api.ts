// API Configuration
const API_BASE_URL = "http://127.0.0.1:8000/api"

const headers = {
  "Content-Type": "application/json",
}

// Check if backend is alive
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { headers })
    if (!response.ok) return false
    const data = await response.json()
    return data.status === "healthy" || data.status === "models_missing"
  } catch (error) {
    return false
  }
}

// Fetch all transactions (Stub for now)
export const getTransactions = async () => {
  const response = await fetch(`${API_BASE_URL}/transactions`, { headers }).catch(() => ({ ok: true, json: () => [] }))
  if (!("ok" in response) || !response.ok) throw new Error("Failed to fetch transactions")
  return response.json()
}

// Fetch all alerts
export const getAlerts = async () => {
  const response = await fetch(`${API_BASE_URL}/alerts`, { headers })
  if (!response.ok) throw new Error("Failed to fetch alerts")
  return response.json()
}

// Fetch model metrics
export const getMetrics = async () => {
  const response = await fetch(`${API_BASE_URL}/metrics`, { headers }).catch(() => ({ ok: true, json: () => ({}) }))
  if (!("ok" in response) || !response.ok) throw new Error("Failed to fetch metrics")
  return response.json()
}

// Simulate a new transaction through the ML pipeline
export const simulateTransaction = async (transactionData: any) => {
  const response = await fetch(`${API_BASE_URL}/fraud/predict`, {
    method: "POST",
    headers,
    body: JSON.stringify(transactionData),
  })
  if (!response.ok) throw new Error("Failed to simulate transaction")
  return response.json()
}

// Analytics and User stubs (to be fully implemented later)
export const getAnalytics = async () => {
  const response = await fetch(`${API_BASE_URL}/analytics`, { headers })
  if (!response.ok) throw new Error("Failed to fetch analytics")
  return response.json()
}
