import { useAuth } from '../context/AuthContext'
import RiderDashboard from '../components/rider/RiderDashboard'

function RiderDashboardPage() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return null
  }

  return <RiderDashboard />
}

export default RiderDashboardPage