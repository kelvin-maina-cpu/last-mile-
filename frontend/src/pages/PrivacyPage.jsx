import LegalPage from '../components/home/LegalPage'

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="September 2026">
      <p className="legal__lead">
        Reflex is a delivery coordination platform connecting retailers, dispatchers, and
        riders. This policy explains what information the platform handles and how it is
        treated. It is written in plain language for the current prototype of the product.
      </p>

      <h2 className="legal__h2">1. Information the platform handles</h2>
      <p>
        To coordinate a delivery, Reflex processes the details entered into it: delivery
        requests (customer name, phone, address, and item description), rider assignment
        records, delivery status updates, proof of delivery (verification details and a
        photo captured on completion), and rider ratings. If you sign in with Google,
        Reflex receives your name, email address, and role from the sign-in flow.
      </p>

      <h2 className="legal__h2">2. How information is used</h2>
      <p>
        Information is used only to operate the delivery workflow: creating and tracking
        requests, assigning riders, keeping all parties updated in real time, and recording
        proof of delivery. Reflex does not sell personal information or use it for
        advertising.
      </p>

      <h2 className="legal__h2">3. Local demo data</h2>
      <p>
        The current prototype stores some experience data — such as rider progress, badges,
        and local proof records — in your browser's local storage on your own device. You
        can clear this at any time by logging out and clearing your browser data.
      </p>

      <h2 className="legal__h2">4. Sharing</h2>
      <p>
        Delivery information is shared only with the people involved in that delivery: the
        retailer who created the request, the dispatcher coordinating it, and the rider
        fulfilling it. Proof of delivery details are visible to the parties of the delivery
        on its detail page.
      </p>

      <h2 className="legal__h2">5. Data retention</h2>
      <p>
        Delivery records are retained for as long as they are needed to operate and review
        the delivery workflow. Because this is a prototype, records may be reset during
        development and testing.
      </p>

      <h2 className="legal__h2">6. Your choices</h2>
      <p>
        You can log out at any time from the dashboard navigation. If you have questions
        about information handled by Reflex, use the contact form on the homepage.
      </p>

      <h2 className="legal__h2">7. Changes to this policy</h2>
      <p>
        This policy may be updated as the product evolves. The "last updated" date above
        reflects the current version.
      </p>
    </LegalPage>
  )
}

export default PrivacyPage
