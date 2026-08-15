import { BrowserRouter, Routes, Route } from "react-router-dom"
import DashboardLayout from "./layouts/DashboardLayout"
import Dashboard from "./pages/Dashboard"
import TransactionsPage from "./pages/Transactions"
import AlertsPage from "./pages/Alerts"
import UserRiskPage from "./pages/UserRisk"
import InvestigationPage from "./pages/Investigation"
import AnalyticsPage from "./pages/Analytics"
import ModelPerformancePage from "./pages/ModelPerformance"
import SimulatorPage from "./pages/Simulator"
import ProfilePage from "./pages/Profile"
import SettingsPage from "./pages/Settings"
import { ThemeProvider } from "./components/ThemeProvider"

import { MotionConfig } from "framer-motion"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="fraudguard-ui-theme">
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="simulator" element={<SimulatorPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="risk" element={<UserRiskPage />} />
              <Route path="investigation" element={<InvestigationPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="performance" element={<ModelPerformancePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </MotionConfig>
    </ThemeProvider>
  )
}

export default App
