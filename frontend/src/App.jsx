import { Routes, Route } from 'react-router-dom'
import RiderDashboardPage from './pages/RiderDashboardPage'
import DeliveryDetailPage from './pages/DeliveryDetailPage'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<RiderDashboardPage />} />
        <Route path="/deliveries/:deliveryId" element={<DeliveryDetailPage />} />
      </Routes>
    </div>
  )
}

export default App