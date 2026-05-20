import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions governing your use of ILAKA.',
};

export default function TermsPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground text-sm">Effective date: 1 May 2025 &nbsp;·&nbsp; Last updated: 5 May 2026</p>

      <p>
        Welcome to ILAKA (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). By
        accessing or using our website at <strong>ilaka.app</strong> or any related mobile interface, you agree to be
        bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, do not use the Platform.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 18 years old to create an account or list events. By registering, you represent that you
        meet this requirement and that all information you provide is accurate and complete.
      </p>

      <h2>2. Accounts</h2>
      <p>
        You are responsible for maintaining the confidentiality of your credentials. Notify us immediately at{' '}
        <a href="mailto:support@ilaka.app">support@ilaka.app</a> if you suspect unauthorised access. We reserve the
        right to suspend or terminate accounts that violate these Terms.
      </p>

      <h2>3. User-Generated Content</h2>
      <p>
        When you post an event, image, or any other content on the Platform, you grant ILAKA a non-exclusive,
        worldwide, royalty-free licence to host, display, and distribute that content solely for the purpose of
        operating the Platform. You retain ownership of your content. You must not post content that:
      </p>
      <ul>
        <li>is unlawful, defamatory, or fraudulent;</li>
        <li>infringes third-party intellectual property rights;</li>
        <li>contains malware, spam, or unsolicited commercial communications;</li>
        <li>promotes violence, hatred, or discrimination on any protected ground.</li>
      </ul>
      <p>
        We may remove content that violates these Terms at our sole discretion and without prior notice.
      </p>

      <h2>4. Event Listings and RSVPs</h2>
      <p>
        Event organisers are solely responsible for the accuracy, legality, and fulfilment of their events. ILAKA is
        not a party to any agreement between organisers and attendees. RSVPs are subject to event capacity and the
        organiser&apos;s own cancellation policy.
      </p>

      <h2>5. Payments</h2>
      <p>
        Payments for subscriptions, hosting fees, and promotional placements are processed by{' '}
        <strong>Razorpay Software Private Limited</strong>, a licensed payment aggregator regulated by the Reserve
        Bank of India. By initiating a payment, you agree to Razorpay&apos;s{' '}
        <a href="https://razorpay.com/terms/" target="_blank" rel="noopener noreferrer">Terms of Service</a>. ILAKA
        does not store your card or bank details. All amounts are in Indian Rupees (INR) unless otherwise stated.
        Refunds, if applicable, are governed by our Refund Policy communicated at the time of purchase.
      </p>

      <h2>6. Prohibited Uses</h2>
      <p>You agree not to:</p>
      <ul>
        <li>scrape, crawl, or systematically extract data from the Platform without written consent;</li>
        <li>attempt to circumvent rate limits, authentication, or access controls;</li>
        <li>use the Platform to send unsolicited messages or to harvest user data;</li>
        <li>impersonate any person or entity.</li>
      </ul>

      <h2>7. Intellectual Property</h2>
      <p>
        The ILAKA name, logo, design, and all proprietary software are owned by us and protected by applicable
        intellectual property laws. Nothing in these Terms grants you a licence to use our trademarks or branding.
      </p>

      <h2>8. Third-Party Services</h2>
      <p>The Platform integrates with the following third-party services:</p>
      <ul>
        <li><strong>Cloudinary</strong> — media storage and delivery</li>
        <li><strong>OpenAI</strong> — AI-powered semantic event search</li>
        <li><strong>Pinecone</strong> — vector database for search indexing</li>
        <li><strong>Razorpay</strong> — payment processing</li>
        <li><strong>PostHog</strong> — product analytics (anonymised)</li>
        <li><strong>Resend / SMTP provider</strong> — transactional email</li>
      </ul>
      <p>
        Your use of these services is subject to their respective terms and privacy policies. We are not responsible
        for the practices of third-party services.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind,
        express or implied, including fitness for a particular purpose or uninterrupted availability. We do not
        guarantee that events listed on the Platform will take place as described.
      </p>

      <h2>10. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by applicable law, ILAKA shall not be liable for any indirect, incidental,
        special, consequential, or punitive damages arising from your use of or inability to use the Platform,
        including losses arising from events listed on the Platform. Our total liability for any claim shall not
        exceed the amount you paid us in the three months preceding the claim.
      </p>

      <h2>11. Governing Law and Dispute Resolution</h2>
      <p>
        These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of
        the courts located in Bengaluru, Karnataka, India. Before initiating legal proceedings, you agree to attempt
        to resolve disputes informally by contacting us at{' '}
        <a href="mailto:support@ilaka.app">support@ilaka.app</a>.
      </p>

      <h2>12. Compliance with Indian Law</h2>
      <p>
        We operate in compliance with the Information Technology Act, 2000, the Information Technology (Intermediary
        Guidelines and Digital Media Ethics Code) Rules, 2021, and the Digital Personal Data Protection Act, 2023
        (&ldquo;DPDP Act&rdquo;). As a Data Fiduciary under the DPDP Act, we process personal data only for lawful
        purposes with your consent or for legitimate purposes as permitted by law.
      </p>

      <h2>13. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be communicated via email or a prominent
        notice on the Platform at least 7 days before they take effect. Continued use of the Platform after the
        effective date constitutes acceptance of the updated Terms.
      </p>

      <h2>14. Contact</h2>
      <p>
        For questions about these Terms, contact us at:{' '}
        <a href="mailto:support@ilaka.app">support@ilaka.app</a>
      </p>
    </article>
  );
}
