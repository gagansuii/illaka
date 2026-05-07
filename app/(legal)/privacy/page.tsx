import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How ILAAKA collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground text-sm">Effective date: 1 May 2025 &nbsp;·&nbsp; Last updated: 5 May 2026</p>

      <p>
        ILAAKA (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your personal
        information. This Privacy Policy explains what data we collect, how we use it, and your rights as a Data
        Principal under the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and applicable
        provisions of the <strong>General Data Protection Regulation (GDPR)</strong>.
      </p>

      <h2>1. Data We Collect</h2>

      <h3>1.1 Account Information</h3>
      <ul>
        <li><strong>Name and email address</strong> — collected at registration; used to identify your account and send transactional emails.</li>
        <li><strong>Password</strong> — stored as a one-way bcrypt hash; we cannot recover your password.</li>
        <li><strong>Email verification status</strong> — to confirm your email address is valid.</li>
      </ul>

      <h3>1.2 Location Data</h3>
      <ul>
        <li>
          <strong>Approximate location (IP-derived)</strong> — resolved from your IP address via ipinfo.io or
          ip-api.com when you first visit the Platform, to show nearby events. This is not stored permanently; it is
          used only to serve the current request.
        </li>
        <li>
          <strong>Precise location (optional)</strong> — if you grant browser geolocation permission, your
          coordinates are used to refine event results. Coordinates are not stored beyond your active session.
        </li>
        <li>
          <strong>Profile location</strong> — if you manually set a home neighbourhood in your profile, it is stored
          in our database and used to personalise your default feed.
        </li>
      </ul>

      <h3>1.3 Event Data</h3>
      <p>
        Events you create (title, description, location, images, dates, capacity) are stored and displayed publicly
        or privately according to your visibility setting.
      </p>

      <h3>1.4 Usage and Engagement Data</h3>
      <ul>
        <li>RSVPs, likes, shares, and attendance records linked to your user ID.</li>
        <li>Product analytics events (page views, feature interactions) collected via <strong>PostHog</strong>. These are associated with an anonymous user ID only — we do not send your name or email to PostHog.</li>
      </ul>

      <h3>1.5 Payment Data</h3>
      <p>
        When you make a payment, Razorpay collects your card/bank/UPI details directly. We store only the Razorpay
        order ID, payment status, amount, and currency — never raw card data.
      </p>

      <h3>1.6 Technical Data</h3>
      <p>
        Standard server logs may capture IP addresses, browser type, and timestamps for security and debugging
        purposes. These are retained for up to 30 days.
      </p>

      <h2>2. Legal Basis for Processing</h2>
      <p>We process your data on the following bases:</p>
      <ul>
        <li><strong>Consent</strong> — account registration, location sharing, marketing communications (if applicable).</li>
        <li><strong>Contractual necessity</strong> — processing payments, sending tickets, managing events you create or RSVP to.</li>
        <li><strong>Legitimate interests</strong> — fraud prevention, security monitoring, product improvement via anonymised analytics.</li>
        <li><strong>Legal obligation</strong> — compliance with Indian tax, anti-money laundering, and IT Act requirements.</li>
      </ul>

      <h2>3. How We Use Your Data</h2>
      <ul>
        <li>To create and manage your account.</li>
        <li>To show you nearby events based on your location.</li>
        <li>To send transactional emails: registration confirmation, email verification, password reset, event tickets.</li>
        <li>To process payments for subscriptions, event hosting fees, and promotional placements.</li>
        <li>To compute engagement scores that rank events in the feed.</li>
        <li>To power semantic event search using OpenAI embeddings and Pinecone vector search.</li>
        <li>To monitor for abuse and enforce our Terms of Service.</li>
        <li>To improve the Platform through anonymised product analytics.</li>
      </ul>

      <h2>4. Third-Party Data Processors</h2>
      <p>
        We share data with the following processors who act under contractual data processing agreements:
      </p>
      <table>
        <thead>
          <tr><th>Processor</th><th>Purpose</th><th>Data shared</th></tr>
        </thead>
        <tbody>
          <tr><td>Razorpay</td><td>Payment processing</td><td>Name, email, order amount</td></tr>
          <tr><td>Cloudinary</td><td>Image storage and delivery</td><td>Uploaded event/profile images</td></tr>
          <tr><td>OpenAI</td><td>Semantic search embeddings</td><td>Event title + description text only</td></tr>
          <tr><td>Pinecone</td><td>Vector search index</td><td>Event ID + embedding vectors</td></tr>
          <tr><td>PostHog</td><td>Product analytics</td><td>Anonymous user ID, page events</td></tr>
          <tr><td>Resend / SMTP</td><td>Transactional email delivery</td><td>Your email address, email content</td></tr>
          <tr><td>Vercel</td><td>Hosting and edge compute</td><td>Request logs (IP, headers)</td></tr>
        </tbody>
      </table>
      <p>
        We do not sell your personal data to third parties. We do not use your data for behavioural advertising.
      </p>

      <h2>5. Data Retention</h2>
      <ul>
        <li><strong>Account data</strong> — retained while your account is active and for 90 days after deletion to allow for account recovery.</li>
        <li><strong>Event data</strong> — retained while the event is active; expired events are automatically purged 30 days after their end time.</li>
        <li><strong>Payment records</strong> — retained for 7 years as required by Indian tax and accounting regulations.</li>
        <li><strong>Server logs</strong> — retained for 30 days.</li>
        <li><strong>Email verification tokens</strong> — expire after 24 hours.</li>
        <li><strong>Password reset tokens</strong> — expire after 1 hour.</li>
      </ul>

      <h2>6. Your Rights</h2>
      <p>
        Under the DPDP Act and GDPR (where applicable), you have the following rights:
      </p>
      <ul>
        <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
        <li><strong>Correction</strong> — update inaccurate or incomplete data via your profile settings or by contacting us.</li>
        <li><strong>Erasure</strong> — request deletion of your account and associated personal data, subject to legal retention obligations.</li>
        <li><strong>Portability</strong> — receive your data in a structured, machine-readable format.</li>
        <li><strong>Withdrawal of consent</strong> — withdraw consent at any time where processing is consent-based (e.g., location sharing).</li>
        <li><strong>Grievance redressal</strong> — raise a complaint with our Grievance Officer or with the Data Protection Board of India.</li>
      </ul>
      <p>
        To exercise any of these rights, contact our Grievance Officer at:{' '}
        <a href="mailto:privacy@ilaka.app">privacy@ilaka.app</a>. We will respond within 30 days.
      </p>

      <h2>7. Cookies and Local Storage</h2>
      <p>
        We use <strong>no third-party tracking cookies</strong>. Session authentication uses an HttpOnly, Secure,
        SameSite=Lax cookie managed by NextAuth. Product analytics (PostHog) use <strong>localStorage</strong> only,
        not cookies, to store an anonymous identifier.
      </p>

      <h2>8. Children&apos;s Privacy</h2>
      <p>
        ILAAKA is not directed at children under 18. We do not knowingly collect personal data from minors. If you
        believe a minor has registered, contact us and we will delete the account.
      </p>

      <h2>9. Data Security</h2>
      <p>
        We implement industry-standard security measures including TLS encryption in transit, bcrypt password hashing,
        HttpOnly session cookies, timing-safe webhook signature verification, and rate limiting on all sensitive
        endpoints. No system is perfectly secure; we cannot guarantee absolute security.
      </p>

      <h2>10. International Transfers</h2>
      <p>
        Some of our third-party processors (OpenAI, Pinecone, PostHog, Cloudinary) are based outside India. Where
        data is transferred internationally, we rely on contractual safeguards and the respective processor&apos;s
        compliance with applicable data protection law.
      </p>

      <h2>11. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes will be communicated by email or a
        notice on the Platform at least 7 days before they take effect. Continued use of the Platform constitutes
        acceptance of the updated policy.
      </p>

      <h2>12. Grievance Officer</h2>
      <p>
        In accordance with the Information Technology Act, 2000 and the DPDP Act, the details of our Grievance
        Officer are:
      </p>
      <p>
        <strong>Name:</strong> ILAAKA Support Team<br />
        <strong>Email:</strong> <a href="mailto:privacy@ilaka.app">privacy@ilaka.app</a><br />
        <strong>Response time:</strong> Within 30 days of receiving a complaint.
      </p>

      <h2>13. Contact</h2>
      <p>
        For any privacy-related queries, contact us at{' '}
        <a href="mailto:privacy@ilaka.app">privacy@ilaka.app</a>.
      </p>
    </article>
  );
}
