import { Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import RetailerPage from './pages/RetailerPage'
import DispatcherPage from './pages/DispatcherPage'
import RiderDashboardPage from './pages/RiderDashboardPage'
import DeliveryDetailPage from './pages/DeliveryDetailPage'

function App() {
  return (
    <div className="app">
      <Navigation />
      <Routes>
        <Route path="/" element={<RetailerPage />} />
        <Route path="/retailer" element={<RetailerPage />} />
        <Route path="/dispatcher" element={<DispatcherPage />} />
        <Route path="/rider" element={<RiderDashboardPage />} />
        <Route path="/deliveries/:deliveryId" element={<DeliveryDetailPage />} />
      </Routes>
    </div>
  )
}

export default App