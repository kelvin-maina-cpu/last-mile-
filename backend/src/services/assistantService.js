// Answers for the Reflex Assistant chat widget. Keep every answer grounded
// in what the app actually does — check the real routes/components before
// changing these, don't just describe what sounds plausible.
const FAQ = [
  {
    keywords: ['track', 'status', 'where is my delivery', 'follow my'],
    answer:
      "Every delivery moves through four stages: REQUESTED → ASSIGNED → PICKED_UP → DELIVERED. Open the Dispatcher Dashboard to see every delivery's current status, or open a single delivery's detail page to follow just that one.",
  },
  {
    keywords: ['create', 'new delivery', 'request a delivery', 'place an order', 'make a delivery'],
    answer:
      'Log in as a Retailer and fill in the delivery form — customer name, phone, address, and item description. Submitting it creates a delivery in the REQUESTED state.',
  },
  {
    keywords: ['proof of delivery', 'pod', 'signature', 'verify my delivery', 'photo'],
    answer:
      "Proof of delivery has two parts: the rider verifies the customer's ID, then takes a photo of the delivered item. Both are shown on the delivery's detail page once it's marked DELIVERED. There's no signature capture yet.",
  },
  {
    keywords: ['rating', 'rate', 'review rider', 'stars'],
    answer:
      "Riders can see their own rating on their dashboard — average out of 5, star breakdown, and total ratings — aggregated from ratings tied to their deliveries. It'll show \"No ratings yet\" until ratings exist; there isn't a rate-a-rider screen for customers yet.",
  },
  {
    keywords: ['log in', 'login', 'sign in', 'switch role', 'change role', 'account', 'google'],
    answer:
      'You can sign in with Google, or pick Retailer, Dispatcher, or Rider on the login screen to continue as a demo account for that role. Log out and back in to switch roles.',
  },
  {
    keywords: ['assign', 'rider assignment', 'available rider'],
    answer:
      'As a Dispatcher, open a REQUESTED delivery and pick from the list of available riders to assign it. Once assigned, the delivery moves to ASSIGNED and that rider becomes unavailable until the delivery is complete.',
  },
  {
    keywords: ['contact support', 'get help', 'talk to a human'],
    answer: "You're already in the right place — ask me directly. There isn't a separate support email set up yet.",
  },
];

const FALLBACK_ANSWER =
  "I'm not sure about that one yet. I can help with: tracking a delivery, creating a delivery request, proof of delivery, rider ratings, rider assignment, and logging in.";

function answerQuestion(message) {
  const normalized = message.toLowerCase();
  const match = FAQ.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)));
  return match ? match.answer : FALLBACK_ANSWER;
}

module.exports = { answerQuestion, FAQ, FALLBACK_ANSWER };
