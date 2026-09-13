import LegalPage from '../components/home/LegalPage'

function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="September 2026">
      <p className="legal__lead">
        These terms govern your use of the Reflex delivery coordination platform. By using
        Reflex — as a retailer, dispatcher, or rider — you agree to them.
      </p>

      <h2 className="legal__h2">1. The service</h2>
      <p>
        Reflex provides a shared workflow for last-mile delivery coordination: retailers
        create delivery requests, dispatchers review and assign them to riders, and riders
        pick up, update, and complete deliveries with proof of delivery.
      </p>

      <h2 className="legal__h2">2. Accounts and roles</h2>
      <p>
        Access to dashboards is role-based. You are responsible for the accuracy of the
        information you enter and for activity that happens under your account. In the
        current prototype, demo accounts are provided for evaluation purposes.
      </p>

      <h2 className="legal__h2">3. Acceptable use</h2>
      <p>
        Do not misuse the platform: don't submit false delivery requests, interfere with
        other users' deliveries, attempt to access data or dashboards that aren't yours, or
        disrupt the service's operation.
      </p>

      <h2 className="legal__h2">4. Proof of delivery</h2>
      <p>
        Riders capture proof of delivery — including verification details and a photo — when
        completing a delivery. Captured proof should accurately represent the delivery and
        may be reviewed by the parties involved in that delivery.
      </p>

      <h2 className="legal__h2">5. Prototype status</h2>
      <p>
        Reflex is actively being developed. Features may change, and the service is provided
        "as is" without warranties of any kind. Availability, accuracy, and fitness for a
        particular purpose are not guaranteed while the product is in prototype stage.
      </p>

      <h2 className="legal__h2">6. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Reflex is not liable for indirect,
        incidental, or consequential damages arising from use of the platform, including
        lost deliveries, delayed deliveries, or lost data.
      </p>

      <h2 className="legal__h2">7. Changes to these terms</h2>
      <p>
        These terms may be updated as the product evolves. Continued use of the platform
        after changes are published constitutes acceptance of the updated terms. The "last
        updated" date above reflects the current version.
      </p>
    </LegalPage>
  )
}

export default TermsPage
