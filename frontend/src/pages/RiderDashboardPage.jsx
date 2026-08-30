import RiderDashboard from '../components/rider/RiderDashboard'

const CURRENT_RIDER_ID = 'rider-001'

function RiderDashboardPage() {
  return <RiderDashboard riderId={CURRENT_RIDER_ID} />
}

export default RiderDashboardPage