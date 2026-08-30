import { Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RetailerPage from './pages/RetailerPage'
import DispatcherPage from './pages/DispatcherPage'
import RiderDashboardPage from './pages/RiderDashboardPage'
import DeliveryDetailPage from './pages/DeliveryDetailPage'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/retailer"
          element={
            <>
              <Navigation />
              <RetailerPage />
            </>
          }
        />
        <Route
          path="/dispatcher"
          element={
            <>
              <Navigation />
              <DispatcherPage />
            </>
          }
        />
        <Route
          path="/rider"
          element={
            <>
              <Navigation />
              <RiderDashboardPage />
            </>
          }
        />
        <Route
          path="/deliveries/:deliveryId"
          element={
            <>
              <Navigation />
              <DeliveryDetailPage />
            </>
          }
        />
      </Routes>
    </div>
  )
}

export default App