import { Router } from 'express'
import { getDb } from '../db/database.js'
import { authenticateToken, optionalAuth } from '../middleware/auth.js'

const router = Router()

// Knowledge base for Reflex-specific questions
const KNOWLEDGE_BASE = {
  greetings: {
    patterns: [/^(hi|hello|hey|good morning|good afternoon|good evening)/i],
    response: "Hello! 👋 I'm the Reflex Assistant. I can help you with questions about Reflex deliveries, riders, orders, and platform features. What would you like to know?",
  },
  tracking: {
    patterns: [/track.*delivery/i, /where.*delivery/i, /delivery.*status/i, /my.*delivery/i, /order.*status/i, /where.*order/i],
    response: "To track your delivery in Reflex:\n\n1. **As a Customer**: You'll receive updates via SMS/WhatsApp with your delivery status. You can also ask your retailer for the delivery ID.\n\n2. **As a Rider**: Go to your Rider Dashboard to see all assigned deliveries and their current status.\n\n3. **As a Dispatcher**: Use the Dispatcher Dashboard to view all deliveries across all riders with real-time status updates.\n\nDelivery statuses follow this flow: OPEN → ASSIGNED → PICKED_UP → DELIVERED.",
  },
  proofOfDelivery: {
    patterns: [/proof.*delivery/i, /pod/i, /delivery.*proof/i, /confirm.*delivery/i],
    response: "Proof of Delivery (POD) in Reflex is a 3-step verification process:\n\n**Step 1 - Customer ID Verification**: The rider enters the customer's unique Customer ID to verify their identity.\n\n**Step 2 - Photo Capture**: The rider takes a photo of the delivered package using their device camera.\n\n**Step 3 - Complete**: The system confirms the verification and records the delivery with a timestamp.\n\nThis ensures accountability and prevents delivery disputes.",
  },
  ratings: {
    patterns: [/rider.*rating/i, /rating/i, /star/i, /feedback/i, /how.*rate/i],
    response: "Rider ratings in Reflex work on a **5-star scale**:\n\n⭐⭐⭐⭐⭐ 5 - Excellent\n⭐⭐⭐⭐ 4 - Good\n⭐⭐⭐ 3 - Average\n⭐⭐ 2 - Below Average\n⭐ 1 - Poor\n\nRatings are submitted by customers after successful deliveries. Each rider's overall rating is calculated as an average of all their ratings. You can view your rating on the Rider Dashboard.\n\nHigh ratings help riders get more delivery assignments!",
  },
  otp: {
    patterns: [/otp/i, /verification.*code/i, /verify.*delivery/i, /one.*time/i],
    response: "Reflex uses **OTP (One-Time Password)** verification as part of the delivery process:\n\n- When a delivery is assigned, an OTP is generated\n- The customer receives the OTP via SMS\n- The rider must verify the OTP with the customer before completing the delivery\n- This ensures the package reaches the correct recipient\n\nOTP verification works alongside the Customer ID verification in the Proof of Delivery flow.",
  },
  login: {
    patterns: [/log.*in/i, /sign.*in/i, /login/i, /authenticate/i, /account/i, /password/i, /forgot.*password/i],
    response: "Here's how to log in to Reflex:\n\n**Email/Password Login**:\n1. Go to the Login page\n2. Enter your registered email address\n3. Enter your password\n4. Click 'Login'\n\n**Google Login**:\n1. Click 'Continue with Google' on the Login or Landing page\n2. Select your Google account\n3. You'll be redirected back to Reflex\n\n**Demo Accounts**:\n- All demo accounts use password: `password123`\n- Rider accounts: james@reflex.co.ke, faith@reflex.co.ke, peter@reflex.co.ke, grace@reflex.co.ke, brian@reflex.co.ke\n- Dispatcher: admin@reflex.co.ke\n- Retailer: shop@retailer.co.ke",
  },
  roles: {
    patterns: [/role/i, /dispatcher/i, /retailer/i, /rider/i, /customer/i, /who.*can/i],
    response: "Reflex has 4 user roles:\n\n**Rider** 👥\n- View assigned deliveries\n- Update delivery status (Pick Up, Deliver)\n- Complete Proof of Delivery\n- View personal ratings\n\n**Dispatcher** 🗺️\n- View all deliveries\n- Assign riders to deliveries\n- Track delivery status\n- Manage rider assignments\n\n**Retailer** 📦\n- Create new delivery requests\n- Track created deliveries\n- View delivery history\n\n**Customer** 🏠\n- Track incoming deliveries\n- Verify delivery with Customer ID\n- Rate riders after delivery",
  },
  howToUse: {
    patterns: [/how.*use/i, /how.*work/i, /get.*started/i, /tutorial/i, /guide/i, /help.*me/i],
    response: "Here's how to use Reflex:\n\n**Getting Started**:\n1. Log in with your email/password or Google account\n2. You'll be directed to your role-specific dashboard\n\n**For Retailers**:\n1. Go to Retailer page\n2. Fill in delivery details (customer name, phone, address, items)\n3. Submit to create a delivery request\n\n**For Dispatchers**:\n1. View all pending deliveries on your dashboard\n2. Click 'Assign Rider' on OPEN deliveries\n3. Select an available rider from the list\n\n**For Riders**:\n1. View your assigned deliveries\n2. Tap a delivery to see details\n3. Update status: Pick Up → Complete with POD\n4. Follow the 3-step Proof of Delivery process",
  },
  faq: {
    patterns: [/faq/i, /frequently/i, /common.*question/i],
    response: "Reflex Frequently Asked Questions:\n\n**Q: What is Reflex?**\nA: Reflex is a last-mile delivery coordination platform connecting retailers, dispatchers, riders, and customers.\n\n**Q: How do I become a rider?**\nA: Register as a rider on the platform. You'll need a valid phone number and vehicle details.\n\n**Q: Can I track my delivery in real-time?**\nA: Yes! Dispatchers and riders see real-time updates. Customers receive SMS notifications at each status change.\n\n**Q: What happens if a delivery fails?**\nA: Failed deliveries are returned to OPEN status and can be reassigned to another rider.\n\n**Q: Is my data safe?**\nA: Yes, Reflex uses encrypted storage and secure authentication to protect all user data.",
  },
  contact: {
    patterns: [/contact/i, /support/i, /email/i, /phone.*number/i, /reach/i],
    response: "You can reach Reflex support through:\n\n📧 **Email**: support@reflex.co.ke\n📱 **Phone**: +254 700 000 000\n🏢 **Office**: Nairobi, Kenya\n\n**Business Hours**: Monday - Friday, 8:00 AM - 6:00 PM EAT\n\nFor urgent delivery issues, please contact your assigned dispatcher directly through the app.",
  },
  about: {
    patterns: [/about.*reflex/i, /what.*reflex/i, /reflex.*platform/i, /reflex.*delivery/i, /tell.*about/i],
    response: "Reflex is a **last-mile delivery coordination platform** designed for the Kenyan market.\n\n**Key Features**:\n- 📦 **Delivery Management**: Create, assign, and track deliveries\n- 🏍️ **Rider Dashboard**: Real-time delivery updates and status management\n- 🗺️ **Dispatcher Control**: Centralized view of all deliveries and riders\n- ✅ **Proof of Delivery**: 3-step verification (Customer ID + Photo + Confirmation)\n- ⭐ **Rider Ratings**: Customer feedback system for quality assurance\n- 🔔 **Real-time Updates**: WebSocket-based live status tracking\n- 🤖 **AI Assistant**: In-app support for common questions\n\nReflex connects retailers, dispatchers, riders, and customers for seamless last-mile delivery.",
  },
}

// Off-topic responses
const OFF_TOPIC_RESPONSE = "I'm the Reflex Assistant, so I can only help with questions about Reflex deliveries, riders, orders, accounts, and platform features.\n\nI can help with:\n- 🔍 Delivery tracking\n- ✅ Proof of Delivery\n- ⭐ Rider ratings\n- 🔐 Login & accounts\n- 📋 How to use Reflex\n- ❓ Reflex FAQs\n\nWhat would you like to know?"

function findResponse(message) {
  for (const [key, entry] of Object.entries(KNOWLEDGE_BASE)) {
    for (const pattern of entry.patterns) {
      if (pattern.test(message)) {
        return entry.response
      }
    }
  }
  return OFF_TOPIC_RESPONSE
}

// POST /api/chat - Send message to chatbot
router.post('/', optionalAuth, (req, res) => {
  try {
    const { message } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' })
    }

    const trimmed = message.trim()
    if (trimmed.length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' })
    }

    if (trimmed.length > 500) {
      return res.status(400).json({ error: 'Message too long. Please keep it under 500 characters.' })
    }

    const response = findResponse(trimmed)

    res.json({
      message: response,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Chat] Error:', error)
    res.status(500).json({ error: 'Failed to process message' })
  }
})

// GET /api/chat/suggestions - Get suggested questions
router.get('/suggestions', (req, res) => {
  res.json({
    suggestions: [
      'How do I track my delivery?',
      'What is proof of delivery?',
      'How do rider ratings work?',
      'How do I verify my delivery?',
      'How do I log in?',
    ],
  })
})

export default router
