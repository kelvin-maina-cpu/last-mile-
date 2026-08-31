import bcrypt from 'bcryptjs'

// In-memory data store for the demo
const store = {
  users: [],
  riderProfiles: [],
  customers: [],
  deliveries: [],
  riderRatings: [],
}

// Simple query helpers
export function getDb() {
  return {
    prepare(sql) {
      return {
        get(...params) {
          return executeQuery(sql, params, 'get')
        },
        all(...params) {
          return executeQuery(sql, params, 'all')
        },
        run(...params) {
          return executeQuery(sql, params, 'run')
        },
      }
    },
    exec(sql) {
      // No-op for in-memory store - schema is implicit
    },
    pragma() {},
    transaction(fn) {
      return (...params) => fn(...params)
    },
  }
}

function executeQuery(sql, params, mode) {
  const normalizedSql = sql.trim().replace(/\s+/g, ' ').toLowerCase()

  // INSERT operations
  if (normalizedSql.startsWith('insert into users')) {
    const user = {
      id: params[0],
      email: params[1],
      password_hash: params[2],
      name: params[3],
      role: params[4],
      google_id: params[5],
      avatar_url: params[6],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    store.users.push(user)
    return { changes: 1 }
  }

  if (normalizedSql.startsWith('insert into rider_profiles')) {
    const profile = {
      id: params[0],
      user_id: params[1],
      phone: params[2],
      vehicle_type: params[3],
      license_plate: params[4],
      available: params[5],
      latitude: params[6],
      longitude: params[7],
      created_at: new Date().toISOString(),
    }
    store.riderProfiles.push(profile)
    return { changes: 1 }
  }

  if (normalizedSql.startsWith('insert into customers')) {
    const customer = {
      id: params[0],
      user_id: params[1],
      name: params[2],
      phone: params[3],
      address: params[4],
      created_at: new Date().toISOString(),
    }
    store.customers.push(customer)
    return { changes: 1 }
  }

  if (normalizedSql.startsWith('insert into deliveries')) {
    const delivery = {
      id: params[0],
      customer_name: params[1],
      customer_phone: params[2],
      customer_id: params[3],
      address: params[4],
      item_description: params[5],
      status: params[6] || 'OPEN',
      rider_id: params[7] || null,
      proof_of_delivery: params[8] || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    store.deliveries.push(delivery)
    return { changes: 1 }
  }

  if (normalizedSql.startsWith('insert into rider_ratings')) {
    const rating = {
      id: params[0],
      rider_id: params[1],
      delivery_id: params[2],
      customer_name: params[3],
      rating: params[4],
      comment: params[5],
      created_at: params[6] || new Date().toISOString(),
    }
    store.riderRatings.push(rating)
    return { changes: 1 }
  }

  // SELECT COUNT(*) operations
  if (normalizedSql.includes('select count(*)') && normalizedSql.includes('from users')) {
    return { count: store.users.length }
  }

  // SELECT operations with JOINs
  if (normalizedSql.includes('from users u') && normalizedSql.includes('join rider_profiles rp')) {
    if (normalizedSql.includes('where u.id = ?') && normalizedSql.includes("u.role = 'rider'")) {
      const user = store.users.find(u => u.id === params[0] && u.role === 'rider')
      if (!user) return undefined
      const profile = store.riderProfiles.find(p => p.user_id === user.id)
      return { ...user, ...profile }
    }
    // All riders
    const riders = store.users.filter(u => u.role === 'rider')
    return riders.map(u => {
      const profile = store.riderProfiles.find(p => p.user_id === u.id) || {}
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: profile.phone,
        vehicle_type: profile.vehicle_type,
        license_plate: profile.license_plate,
        available: profile.available,
      }
    })
  }

  // SELECT from users
  if (normalizedSql.startsWith('select * from users where email = ?')) {
    return store.users.find(u => u.email === params[0])
  }
  if (normalizedSql.startsWith('select * from users where id = ?') && !normalizedSql.includes('and role')) {
    return store.users.find(u => u.id === params[0])
  }
  if (normalizedSql.startsWith('select id from users where email = ?')) {
    const user = store.users.find(u => u.email === params[0])
    return user ? { id: user.id } : undefined
  }
  // Handle any SELECT from users WHERE id = ? (including column-specific selects)
  if (normalizedSql.includes('from users') && normalizedSql.includes('where id = ?') && !normalizedSql.includes('and role') && !normalizedSql.includes('google_id')) {
    const user = store.users.find(u => u.id === params[0])
    if (!user) return undefined
    // Return only requested columns if specified, otherwise full user
    if (normalizedSql.includes('select id, email, name, role')) {
      return { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url: user.avatar_url }
    }
    return user
  }
  if (normalizedSql.includes('select * from users where google_id') || normalizedSql.includes('where google_id')) {
    return store.users.find(u => u.google_id === params[0] || u.email === params[1])
  }
  if (normalizedSql.startsWith('select * from users where id = ?') && normalizedSql.includes('and role = ?')) {
    return store.users.find(u => u.id === params[0] && u.role === params[1])
  }
  if (normalizedSql.includes('select u.id, u.email, u.name, u.role') && normalizedSql.includes('from users u') && normalizedSql.includes('where u.password_hash is not null')) {
    return store.users
      .filter(u => u.password_hash != null)
      .map(u => {
        const profile = store.riderProfiles.find(p => p.user_id === u.id) || {}
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          phone: profile.phone,
          vehicle_type: profile.vehicle_type,
        }
      })
  }
  if (normalizedSql.startsWith('select * from users where id = ?') && normalizedSql.includes('role = ?')) {
    return store.users.find(u => u.id === params[0] && u.role === params[1])
  }

  // SELECT from rider_profiles
  if (normalizedSql.startsWith('select * from rider_profiles where user_id = ?')) {
    return store.riderProfiles.find(p => p.user_id === params[0])
  }
  if (normalizedSql.startsWith('select * from rider_profiles where id = ?')) {
    return store.riderProfiles.find(p => p.id === params[0])
  }

  // SELECT from deliveries
  if (normalizedSql.startsWith('select * from deliveries where rider_id = ?')) {
    return store.deliveries.filter(d => d.rider_id === params[0])
  }
  if (normalizedSql.startsWith('select * from deliveries where id = ?')) {
    return store.deliveries.find(d => d.id === params[0])
  }
  if (normalizedSql.startsWith('select * from deliveries order by')) {
    return [...store.deliveries].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  // UPDATE deliveries
  if (normalizedSql.includes('update deliveries set status = ?, updated_at')) {
    const delivery = store.deliveries.find(d => d.id === params[1])
    if (delivery) {
      delivery.status = params[0]
      delivery.updated_at = new Date().toISOString()
    }
    return { changes: delivery ? 1 : 0 }
  }
  if (normalizedSql.includes('update deliveries set rider_id = ?, status')) {
    const delivery = store.deliveries.find(d => d.id === params[1])
    if (delivery) {
      delivery.rider_id = params[0]
      delivery.status = 'ASSIGNED'
      delivery.updated_at = new Date().toISOString()
    }
    return { changes: delivery ? 1 : 0 }
  }
  if (normalizedSql.includes('update deliveries set status = "delivered", proof_of_delivery')) {
    const delivery = store.deliveries.find(d => d.id === params[1])
    if (delivery) {
      delivery.status = 'DELIVERED'
      delivery.proof_of_delivery = params[0]
      delivery.updated_at = new Date().toISOString()
    }
    return { changes: delivery ? 1 : 0 }
  }

  // UPDATE users
  if (normalizedSql.includes('update users set google_id')) {
    const user = store.users.find(u => u.id === params[2])
    if (user) {
      user.google_id = params[0]
      user.avatar_url = params[1]
    }
    return { changes: user ? 1 : 0 }
  }

  // SELECT from rider_ratings
  if (normalizedSql.includes('select') && normalizedSql.includes('from rider_ratings') && normalizedSql.includes('group by rating')) {
    const ratings = store.riderRatings.filter(r => r.rider_id === params[0])
    const grouped = {}
    for (const r of ratings) {
      grouped[r.rating] = (grouped[r.rating] || 0) + 1
    }
    return Object.entries(grouped).map(([rating, count]) => ({ rating: parseInt(rating), count }))
  }
  if (normalizedSql.includes('select') && normalizedSql.includes('from rider_ratings') && normalizedSql.includes('count(*) as total_ratings')) {
    const ratings = store.riderRatings.filter(r => r.rider_id === params[0])
    const total = ratings.length
    const avg = total > 0 ? (ratings.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : 0
    return { total_ratings: total, average_rating: parseFloat(avg) }
  }
  if (normalizedSql.startsWith('select id, customer_name, rating, comment, created_at from rider_ratings')) {
    const limit = normalizedSql.includes('limit 10') ? 10 : 100
    return store.riderRatings
      .filter(r => r.rider_id === params[0])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit)
      .map(r => ({
        id: r.id,
        customer_name: r.customer_name,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
      }))
  }

  // DELETE operations
  if (normalizedSql.startsWith('delete from deliveries where id = ?')) {
    const index = store.deliveries.findIndex(d => d.id === params[0])
    if (index !== -1) {
      store.deliveries.splice(index, 1)
      return { changes: 1 }
    }
    return { changes: 0 }
  }

  if (normalizedSql.startsWith('delete from users where id = ?')) {
    const index = store.users.findIndex(u => u.id === params[0])
    if (index !== -1) {
      store.users.splice(index, 1)
      return { changes: 1 }
    }
    return { changes: 0 }
  }

  console.warn('[DB] Unhandled query:', normalizedSql.substring(0, 100))
  return mode === 'all' ? [] : undefined
}

export function initializeDatabase() {
  const salt = bcrypt.genSaltSync(10)
  const defaultPassword = bcrypt.hashSync('password123', salt)

  // Users
  store.users = [
    // Riders
    { id: 'rider-001', email: 'james@reflex.co.ke', password_hash: defaultPassword, name: 'James Mwangi', role: 'rider', google_id: null, avatar_url: null, created_at: '2026-08-28T00:00:00.000Z', updated_at: '2026-08-28T00:00:00.000Z' },
    { id: 'rider-002', email: 'faith@reflex.co.ke', password_hash: defaultPassword, name: 'Faith Wanjiku', role: 'rider', google_id: null, avatar_url: null, created_at: '2026-08-28T00:00:00.000Z', updated_at: '2026-08-28T00:00:00.000Z' },
    { id: 'rider-003', email: 'peter@reflex.co.ke', password_hash: defaultPassword, name: 'Peter Ochieng', role: 'rider', google_id: null, avatar_url: null, created_at: '2026-08-28T00:00:00.000Z', updated_at: '2026-08-28T00:00:00.000Z' },
    { id: 'rider-004', email: 'grace@reflex.co.ke', password_hash: defaultPassword, name: 'Grace Achieng', role: 'rider', google_id: null, avatar_url: null, created_at: '2026-08-28T00:00:00.000Z', updated_at: '2026-08-28T00:00:00.000Z' },
    { id: 'rider-005', email: 'brian@reflex.co.ke', password_hash: defaultPassword, name: 'Brian Kiprop', role: 'rider', google_id: null, avatar_url: null, created_at: '2026-08-28T00:00:00.000Z', updated_at: '2026-08-28T00:00:00.000Z' },
    // Dispatchers
    { id: 'dispatcher-001', email: 'admin@reflex.co.ke', password_hash: defaultPassword, name: 'Sarah Dispatcher', role: 'dispatcher', google_id: null, avatar_url: null, created_at: '2026-08-28T00:00:00.000Z', updated_at: '2026-08-28T00:00:00.000Z' },
    { id: 'dispatcher-002', email: 'ops@reflex.co.ke', password_hash: defaultPassword, name: 'David Operations', role: 'dispatcher', google_id: null, avatar_url: null, created_at: '2026-08-28T00:00:00.000Z', updated_at: '2026-08-28T00:00:00.000Z' },
    // Retailers
    { id: 'retailer-001', email: 'shop@retailer.co.ke', password_hash: defaultPassword, name: 'TechZone Electronics', role: 'retailer', google_id: null, avatar_url: null, created_at: '2026-08-28T00:00:00.000Z', updated_at: '2026-08-28T00:00:00.000Z' },
    { id: 'retailer-002', email: 'pharmacy@retailer.co.ke', password_hash: defaultPassword, name: 'HealthPlus Pharmacy', role: 'retailer', google_id: null, avatar_url: null, created_at: '2026-08-28T00:00:00.000Z', updated_at: '2026-08-28T00:00:00.000Z' },
    // Customers
    { id: 'customer-001', email: 'otieno@gmail.com', password_hash: defaultPassword, name: 'Otieno Kamau', role: 'customer', google_id: null, avatar_url: null, created_at: '2026-08-28T00:00:00.000Z', updated_at: '2026-08-28T00:00:00.000Z' },
    { id: 'customer-002', email: 'achieng@gmail.com', password_hash: defaultPassword, name: 'Achieng Lwanga', role: 'customer', google_id: null, avatar_url: null, created_at: '2026-08-28T00:00:00.000Z', updated_at: '2026-08-28T00:00:00.000Z' },
    { id: 'customer-003', email: 'kimani@gmail.com', password_hash: defaultPassword, name: 'Kimani Thuo', role: 'customer', google_id: null, avatar_url: null, created_at: '2026-08-28T00:00:00.000Z', updated_at: '2026-08-28T00:00:00.000Z' },
  ]

  // Rider profiles
  store.riderProfiles = [
    { id: 'rp-001', user_id: 'rider-001', phone: '0712 345 678', vehicle_type: 'motorcycle', license_plate: 'KDA 123A', available: 1, latitude: -0.3031, longitude: 36.0800, created_at: '2026-08-28T00:00:00.000Z' },
    { id: 'rp-002', user_id: 'rider-002', phone: '0723 456 789', vehicle_type: 'bicycle', license_plate: 'KDB 456B', available: 1, latitude: -0.2980, longitude: 36.0750, created_at: '2026-08-28T00:00:00.000Z' },
    { id: 'rp-003', user_id: 'rider-003', phone: '0734 567 890', vehicle_type: 'motorcycle', license_plate: 'KDC 789C', available: 1, latitude: -0.3100, longitude: 36.0900, created_at: '2026-08-28T00:00:00.000Z' },
    { id: 'rp-004', user_id: 'rider-004', phone: '0745 678 901', vehicle_type: 'motorcycle', license_plate: 'KDD 012D', available: 0, latitude: -0.3050, longitude: 36.0820, created_at: '2026-08-28T00:00:00.000Z' },
    { id: 'rp-005', user_id: 'rider-005', phone: '0756 789 012', vehicle_type: 'bicycle', license_plate: 'KDE 345E', available: 1, latitude: -0.3080, longitude: 36.0850, created_at: '2026-08-28T00:00:00.000Z' },
  ]

  // Customers
  store.customers = [
    { id: 'CUST-0723', user_id: 'customer-001', name: 'Otieno Kamau', phone: '0723 987 654', address: "Ruring'u, Nyeri", created_at: '2026-08-28T00:00:00.000Z' },
    { id: 'CUST-0701', user_id: 'customer-002', name: 'Achieng Lwanga', phone: '0701 222 333', address: 'Kamakwa, Nyeri', created_at: '2026-08-28T00:00:00.000Z' },
    { id: 'CUST-0745', user_id: 'customer-003', name: 'Kimani Thuo', phone: '0745 111 222', address: 'Kiganjo, Nyeri', created_at: '2026-08-28T00:00:00.000Z' },
  ]

  // Deliveries
  store.deliveries = [
    { id: 'DEL-2001', customer_name: 'Otieno Kamau', customer_phone: '0723 987 654', customer_id: 'CUST-0723', address: "Ruring'u, Nyeri", item_description: 'HDMI cable, 20W adapter', status: 'ASSIGNED', rider_id: 'rider-001', proof_of_delivery: null, created_at: '2026-08-30T09:00:00.000Z', updated_at: '2026-08-30T09:00:00.000Z' },
    { id: 'DEL-2002', customer_name: 'Achieng Lwanga', customer_phone: '0701 222 333', customer_id: 'CUST-0701', address: 'Kamakwa, Nyeri', item_description: 'Paracetamol, cough syrup', status: 'PICKED_UP', rider_id: 'rider-001', proof_of_delivery: null, created_at: '2026-08-30T10:00:00.000Z', updated_at: '2026-08-30T10:00:00.000Z' },
    { id: 'DEL-2003', customer_name: 'Kimani Thuo', customer_phone: '0745 111 222', customer_id: 'CUST-0745', address: 'Kiganjo, Nyeri', item_description: 'Phone screen protector', status: 'DELIVERED', rider_id: 'rider-001', proof_of_delivery: JSON.stringify({ customerIdVerified: true, customerId: 'CUST-0745', photo: null, deliveredBy: 'James Mwangi', timestamp: '2026-08-30T14:30:00.000Z' }), created_at: '2026-08-30T08:00:00.000Z', updated_at: '2026-08-30T14:30:00.000Z' },
    { id: 'DEL-2004', customer_name: 'Wanjiru Njoroge', customer_phone: '0733 444 555', customer_id: 'CUST-0733', address: 'Kamwe, Nyeri', item_description: '2kg rice, cooking oil', status: 'ASSIGNED', rider_id: 'rider-001', proof_of_delivery: null, created_at: '2026-08-30T11:00:00.000Z', updated_at: '2026-08-30T11:00:00.000Z' },
    // Rider 002
    { id: 'DEL-2005', customer_name: 'Nancy Akinyi', customer_phone: '0712 111 222', customer_id: 'CUST-0712', address: 'Thika Road, Nairobi', item_description: 'Wireless headphones', status: 'ASSIGNED', rider_id: 'rider-002', proof_of_delivery: null, created_at: '2026-08-30T12:00:00.000Z', updated_at: '2026-08-30T12:00:00.000Z' },
    { id: 'DEL-2006', customer_name: 'Samuel Mutua', customer_phone: '0722 333 444', customer_id: 'CUST-0722', address: 'Westlands, Nairobi', item_description: 'Running shoes', status: 'PICKED_UP', rider_id: 'rider-002', proof_of_delivery: null, created_at: '2026-08-30T13:00:00.000Z', updated_at: '2026-08-30T13:00:00.000Z' },
    { id: 'DEL-2007', customer_name: 'Alice Njeri', customer_phone: '0733 555 666', customer_id: 'CUST-0734', address: 'CBD, Nairobi', item_description: 'Laptop charger', status: 'DELIVERED', rider_id: 'rider-002', proof_of_delivery: JSON.stringify({ customerIdVerified: true, customerId: 'CUST-0734', photo: null, deliveredBy: 'Faith Wanjiku', timestamp: '2026-08-30T15:00:00.000Z' }), created_at: '2026-08-30T07:00:00.000Z', updated_at: '2026-08-30T15:00:00.000Z' },
    // Rider 003
    { id: 'DEL-2008', customer_name: 'Peter Kamotho', customer_phone: '0744 777 888', customer_id: 'CUST-0744', address: 'Kasarani, Nairobi', item_description: 'Bluetooth speaker', status: 'ASSIGNED', rider_id: 'rider-003', proof_of_delivery: null, created_at: '2026-08-30T14:00:00.000Z', updated_at: '2026-08-30T14:00:00.000Z' },
    { id: 'DEL-2009', customer_name: 'Mary Wambui', customer_phone: '0755 999 000', customer_id: 'CUST-0755', address: 'Embu Town', item_description: 'Garden tools set', status: 'DELIVERED', rider_id: 'rider-003', proof_of_delivery: JSON.stringify({ customerIdVerified: true, customerId: 'CUST-0755', photo: null, deliveredBy: 'Peter Ochieng', timestamp: '2026-08-30T16:00:00.000Z' }), created_at: '2026-08-30T06:00:00.000Z', updated_at: '2026-08-30T16:00:00.000Z' },
    // Rider 004
    { id: 'DEL-2010', customer_name: 'Joseph Odhiambo', customer_phone: '0766 111 222', customer_id: 'CUST-0766', address: 'Kisumu Town', item_description: 'Phone case', status: 'ASSIGNED', rider_id: 'rider-004', proof_of_delivery: null, created_at: '2026-08-30T15:00:00.000Z', updated_at: '2026-08-30T15:00:00.000Z' },
    // Rider 005
    { id: 'DEL-2011', customer_name: 'Lucy Muthoni', customer_phone: '0777 333 444', customer_id: 'CUST-0777', address: 'Nakuru Town', item_description: 'Kitchen utensils', status: 'PICKED_UP', rider_id: 'rider-005', proof_of_delivery: null, created_at: '2026-08-30T16:00:00.000Z', updated_at: '2026-08-30T16:00:00.000Z' },
    // Open
    { id: 'DEL-2012', customer_name: 'Kevin Omondi', customer_phone: '0788 555 666', customer_id: 'CUST-0788', address: 'Mombasa Road, Nairobi', item_description: 'USB hub, mouse pad', status: 'OPEN', rider_id: null, proof_of_delivery: null, created_at: '2026-08-30T17:00:00.000Z', updated_at: '2026-08-30T17:00:00.000Z' },
    { id: 'DEL-2013', customer_name: 'Ruth Chebet', customer_phone: '0799 777 888', customer_id: 'CUST-0799', address: 'Langata, Nairobi', item_description: 'Baby clothes', status: 'OPEN', rider_id: null, proof_of_delivery: null, created_at: '2026-08-30T17:30:00.000Z', updated_at: '2026-08-30T17:30:00.000Z' },
  ]

  // Rider ratings
  store.riderRatings = [
    // James Mwangi (rider-001) — 8 ratings
    { id: 'rat-001', rider_id: 'rider-001', delivery_id: 'DEL-2003', customer_name: 'Kimani Thuo', rating: 5, comment: 'Very fast delivery!', created_at: '2026-08-30T14:35:00.000Z' },
    { id: 'rat-002', rider_id: 'rider-001', delivery_id: null, customer_name: 'Grace Wanjiku', rating: 5, comment: 'Excellent service', created_at: '2026-08-29T10:00:00.000Z' },
    { id: 'rat-003', rider_id: 'rider-001', delivery_id: null, customer_name: 'Michael Otieno', rating: 4, comment: 'Good but slightly late', created_at: '2026-08-28T15:00:00.000Z' },
    { id: 'rat-004', rider_id: 'rider-001', delivery_id: null, customer_name: 'Sarah Njeri', rating: 5, comment: 'Very polite and professional', created_at: '2026-08-27T12:00:00.000Z' },
    { id: 'rat-005', rider_id: 'rider-001', delivery_id: null, customer_name: 'David Kipchoge', rating: 4, comment: 'Package was in good condition', created_at: '2026-08-26T09:00:00.000Z' },
    { id: 'rat-006', rider_id: 'rider-001', delivery_id: null, customer_name: 'Anne Muthoni', rating: 5, comment: 'Will use again!', created_at: '2026-08-25T11:00:00.000Z' },
    { id: 'rat-007', rider_id: 'rider-001', delivery_id: null, customer_name: 'Peter Wafula', rating: 5, comment: 'Super fast!', created_at: '2026-08-24T14:00:00.000Z' },
    { id: 'rat-008', rider_id: 'rider-001', delivery_id: null, customer_name: 'Jane Akumu', rating: 4, comment: 'Good service overall', created_at: '2026-08-23T16:00:00.000Z' },
    // Faith Wanjiku (rider-002) — 5 ratings
    { id: 'rat-009', rider_id: 'rider-002', delivery_id: 'DEL-2007', customer_name: 'Alice Njeri', rating: 5, comment: 'Amazing delivery experience', created_at: '2026-08-30T15:05:00.000Z' },
    { id: 'rat-010', rider_id: 'rider-002', delivery_id: null, customer_name: 'James Odhiambo', rating: 4, comment: 'Quick and reliable', created_at: '2026-08-29T13:00:00.000Z' },
    { id: 'rat-011', rider_id: 'rider-002', delivery_id: null, customer_name: 'Mary Wangari', rating: 5, comment: 'Very careful with the package', created_at: '2026-08-28T10:00:00.000Z' },
    { id: 'rat-012', rider_id: 'rider-002', delivery_id: null, customer_name: 'John Mutua', rating: 4, comment: 'Satisfied with service', created_at: '2026-08-27T14:00:00.000Z' },
    { id: 'rat-013', rider_id: 'rider-002', delivery_id: null, customer_name: 'Rose Achieng', rating: 3, comment: 'Delivery was a bit slow', created_at: '2026-08-26T11:00:00.000Z' },
    // Peter Ochieng (rider-003) — 3 ratings
    { id: 'rat-014', rider_id: 'rider-003', delivery_id: 'DEL-2009', customer_name: 'Mary Wambui', rating: 5, comment: 'Perfect delivery!', created_at: '2026-08-30T16:05:00.000Z' },
    { id: 'rat-015', rider_id: 'rider-003', delivery_id: null, customer_name: 'Kevin Omondi', rating: 4, comment: 'Good rider', created_at: '2026-08-29T15:00:00.000Z' },
    { id: 'rat-016', rider_id: 'rider-003', delivery_id: null, customer_name: 'Lilian Chebet', rating: 5, comment: 'Highly recommended', created_at: '2026-08-28T12:00:00.000Z' },
    // Grace Achieng (rider-004) — 2 ratings
    { id: 'rat-017', rider_id: 'rider-004', delivery_id: null, customer_name: 'Patrick Njoroge', rating: 3, comment: 'Average service', created_at: '2026-08-29T09:00:00.000Z' },
    { id: 'rat-018', rider_id: 'rider-004', delivery_id: null, customer_name: 'Faith Wanjiru', rating: 4, comment: 'Decent delivery time', created_at: '2026-08-28T11:00:00.000Z' },
    // Brian Kiprop (rider-005) — 5 ratings
    { id: 'rat-019', rider_id: 'rider-005', delivery_id: null, customer_name: 'Samuel Kiprotich', rating: 5, comment: 'Fantastic service', created_at: '2026-08-30T10:00:00.000Z' },
    { id: 'rat-020', rider_id: 'rider-005', delivery_id: null, customer_name: 'Evelyn Jepkoech', rating: 4, comment: 'Fast and friendly', created_at: '2026-08-29T14:00:00.000Z' },
    { id: 'rat-021', rider_id: 'rider-005', delivery_id: null, customer_name: 'Martin Kibet', rating: 5, comment: 'Excellent!', created_at: '2026-08-28T16:00:00.000Z' },
    { id: 'rat-022', rider_id: 'rider-005', delivery_id: null, customer_name: 'Janet Nafula', rating: 5, comment: 'Very impressed', created_at: '2026-08-27T13:00:00.000Z' },
    { id: 'rat-023', rider_id: 'rider-005', delivery_id: null, customer_name: 'Charles Odongo', rating: 4, comment: 'Good job', created_at: '2026-08-26T10:00:00.000Z' },
  ]

  console.log('[DB] Seed data loaded successfully')
  console.log(`[DB] ${store.users.length} users, ${store.deliveries.length} deliveries, ${store.riderRatings.length} ratings`)
}


