import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Sizzle',
  description: 'Privacy Policy for Sizzle, the restaurant and café management dashboard.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-[100dvh] bg-canvas">
      {/* Nav bar — minimal */}
      <nav className="border-b border-hair px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M3 11C3 8 5 6 7 6C9 6 11 8 11 11" stroke="var(--canvas)" strokeWidth="1.9" strokeLinecap="round"/>
                <path d="M7 6V2M5 4l2-2 2 2" stroke="var(--canvas)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">Sizzle</span>
          </Link>
          <Link href="/" className="text-sm text-ink-4 hover:text-ink transition-colors">
            Back to home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-3 mb-10">
          <p className="text-xs text-accent font-semibold uppercase tracking-widest">Legal</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Privacy Policy</h1>
          <p className="text-sm text-ink-4">Effective date: May 28, 2026 &mdash; Last updated: May 28, 2026</p>
        </div>

        <div className="space-y-10 text-ink-3 leading-relaxed">

          <section className="space-y-4">
            <p className="text-base text-ink-3">
              This Privacy Policy describes how Sizzle, operated by RJ Cabansay (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;),
              collects, uses, stores, and protects the personal information you provide when using our
              restaurant and café management platform. We are committed to protecting your privacy and
              processing your personal data in accordance with the Data Privacy Act of 2012 (Republic
              Act No. 10173) of the Philippines and its implementing rules and regulations.
            </p>
          </section>

          {/* 1 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">1. Information We Collect</h2>
            <p>We collect information you provide directly and information generated through your use of the Service.</p>

            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-ink mb-2">1.1 Account Information</h3>
                <ul className="space-y-2 pl-5 list-disc marker:text-ink-4 text-sm">
                  <li>Email address (used for login and communications)</li>
                  <li>Display name or business name</li>
                  <li>Password (stored as a secure, salted hash &mdash; we never store plaintext passwords)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink mb-2">1.2 Business Data You Enter</h3>
                <p className="text-sm mb-2">
                  All data you input into Sizzle belongs to you. This may include:
                </p>
                <ul className="space-y-2 pl-5 list-disc marker:text-ink-4 text-sm">
                  <li>Business name, address, and type of cuisine or concept</li>
                  <li>Sales records, revenue figures, and sales channels</li>
                  <li>Expense categories and amounts</li>
                  <li>Menu items, recipes, and ingredient costs</li>
                  <li>Inventory levels, unit costs, and stock movements</li>
                  <li>Employee names, roles, pay rates, and payroll records</li>
                  <li>Waste log entries</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink mb-2">1.3 Usage and Technical Data</h3>
                <ul className="space-y-2 pl-5 list-disc marker:text-ink-4 text-sm">
                  <li>Browser type, operating system, and device type</li>
                  <li>IP address and approximate location (country/region level)</li>
                  <li>Pages visited, features used, and session duration</li>
                  <li>Error logs and diagnostic information</li>
                </ul>
                <p className="text-sm mt-2">
                  We collect this information to maintain service reliability, diagnose issues, and
                  understand how users interact with the platform. We do not sell or share this data
                  for advertising purposes.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink mb-2">1.4 Payment Information</h3>
                <p className="text-sm">
                  We do not collect or store your payment card numbers, GCash wallet credentials,
                  or Maya account details. Payment processing is handled entirely by PayMongo,
                  a PCI-DSS compliant payment gateway. We only receive a confirmation token and
                  the last four digits of a card when applicable.
                </p>
              </div>
            </div>
          </section>

          {/* 2 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">2. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul className="space-y-2 pl-5 list-disc marker:text-ink-4">
              <li>To create and manage your account and provide access to the Service.</li>
              <li>To process your subscription, handle billing, and send payment confirmations.</li>
              <li>To operate and display your business data within the dashboard.</li>
              <li>To generate reports, calculations, and AI-powered insights based on your data.</li>
              <li>To send transactional emails such as password resets, billing notices, and account alerts.</li>
              <li>To diagnose bugs, monitor uptime, and improve the reliability of the platform.</li>
              <li>To communicate product updates, new features, or important service announcements.</li>
              <li>To comply with legal obligations under Philippine law.</li>
            </ul>
            <p>
              We do not use your business data to train general-purpose AI models or sell it to advertisers.
              When AI-powered features process your data, they do so to produce results only for your account.
            </p>
          </section>

          {/* 3 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">3. Data Hosting and Storage</h2>
            <p>
              Sizzle is built on Supabase, a managed database and authentication platform. Your data is
              stored in Supabase-managed PostgreSQL databases hosted on cloud infrastructure. Supabase
              uses industry-standard encryption for data at rest (AES-256) and in transit (TLS 1.2+).
            </p>
            <p>
              Data may be stored on servers located outside the Philippines. By using Sizzle, you consent
              to the transfer and storage of your personal data in these locations. We ensure that any
              third-party infrastructure provider we use maintains security standards appropriate to the
              sensitivity of the data processed.
            </p>
          </section>

          {/* 4 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">4. Third-Party Services</h2>
            <p>
              We use a limited number of trusted third-party services to operate Sizzle. Each service
              receives only the data it needs to perform its function:
            </p>

            <div className="space-y-4">
              <div className="rounded-xl border border-hair bg-surface-2 p-5 space-y-1.5 text-sm">
                <p className="font-medium text-ink">Supabase</p>
                <p className="text-ink-4">Database, authentication, and file storage. Stores your account and business data.</p>
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline underline-offset-2">supabase.com/privacy</a>
              </div>

              <div className="rounded-xl border border-hair bg-surface-2 p-5 space-y-1.5 text-sm">
                <p className="font-medium text-ink">PayMongo</p>
                <p className="text-ink-4">Payment gateway for processing subscriptions via card, GCash, and Maya. Receives payment details directly from your browser &mdash; we never see raw card data.</p>
                <a href="https://paymongo.com/privacy" target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline underline-offset-2">paymongo.com/privacy</a>
              </div>

              <div className="rounded-xl border border-hair bg-surface-2 p-5 space-y-1.5 text-sm">
                <p className="font-medium text-ink">Resend</p>
                <p className="text-ink-4">Transactional email delivery. Sends password reset emails, billing confirmations, and account notifications. Receives your email address and the email content only.</p>
                <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline underline-offset-2">resend.com/privacy</a>
              </div>

              <div className="rounded-xl border border-hair bg-surface-2 p-5 space-y-1.5 text-sm">
                <p className="font-medium text-ink">OpenAI</p>
                <p className="text-ink-4">
                  AI-powered features on the Premium plan use the OpenAI API to generate insights from
                  aggregated business data you have entered (e.g., revenue trends, cost summaries).
                  Data sent to OpenAI is used only to produce your result and is not used to train OpenAI models
                  under our API agreement.
                </p>
                <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline underline-offset-2">openai.com/privacy</a>
              </div>
            </div>

            <p>
              We do not permit these service providers to use your data for any purpose other than
              providing their service to us on your behalf.
            </p>
          </section>

          {/* 5 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">5. Cookies and Local Storage</h2>
            <p>
              Sizzle uses cookies and browser local storage for the following purposes:
            </p>
            <ul className="space-y-2 pl-5 list-disc marker:text-ink-4">
              <li>Authentication session tokens (to keep you logged in securely).</li>
              <li>Your selected dashboard theme, stored as a cookie for up to one year.</li>
              <li>UI preferences and state that improve your experience between sessions.</li>
            </ul>
            <p>
              We do not use third-party advertising cookies or tracking pixels. You can clear cookies
              at any time through your browser settings, though doing so will sign you out and reset
              your preferences.
            </p>
          </section>

          {/* 6 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">6. Data Sharing and Disclosure</h2>
            <p>
              We do not sell, rent, or trade your personal information to third parties for marketing
              or commercial purposes. We may disclose your information only in the following circumstances:
            </p>
            <ul className="space-y-2 pl-5 list-disc marker:text-ink-4">
              <li>
                <span className="font-medium text-ink">Service providers:</span> As described in Section 4, we share
                limited data with our trusted infrastructure and payment partners.
              </li>
              <li>
                <span className="font-medium text-ink">Legal compliance:</span> If required by a court order, government
                authority, or applicable Philippine law, we may disclose information to the extent legally compelled.
                We will notify you before disclosure where permitted by law.
              </li>
              <li>
                <span className="font-medium text-ink">Business transfer:</span> In the event of a merger, acquisition,
                or sale of the business, your data may be transferred as part of that transaction.
                We will notify you before your data becomes subject to a different privacy policy.
              </li>
              <li>
                <span className="font-medium text-ink">With your consent:</span> We may share information with third
                parties for any other purpose with your explicit prior consent.
              </li>
            </ul>
          </section>

          {/* 7 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">7. Data Security</h2>
            <p>
              We implement technical and organizational measures to protect your personal information,
              including:
            </p>
            <ul className="space-y-2 pl-5 list-disc marker:text-ink-4">
              <li>All data transmitted between your browser and our servers is encrypted using TLS.</li>
              <li>Passwords are stored using bcrypt hashing with a unique salt per account.</li>
              <li>Authentication is handled by Supabase Auth, which follows industry security practices.</li>
              <li>Access to production databases is restricted to authorized personnel only.</li>
            </ul>
            <p>
              Despite these measures, no system is completely immune to security risks. We encourage
              you to use a strong, unique password for your account and to enable any additional
              security features we make available.
            </p>
          </section>

          {/* 8 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">8. Your Rights Under the Data Privacy Act of 2012</h2>
            <p>
              As a data subject under Republic Act No. 10173 (Data Privacy Act of 2012) and its
              Implementing Rules and Regulations, you have the following rights:
            </p>
            <ul className="space-y-3 pl-5 list-disc marker:text-ink-4">
              <li>
                <span className="font-medium text-ink">Right to be informed:</span> You have the right to know what
                personal data we collect, why we collect it, and how it is processed.
              </li>
              <li>
                <span className="font-medium text-ink">Right of access:</span> You may request a copy of the personal
                data we hold about you at any time.
              </li>
              <li>
                <span className="font-medium text-ink">Right to rectification:</span> You may request correction of
                inaccurate or incomplete personal data. Most account information can be updated directly
                in the dashboard under Settings.
              </li>
              <li>
                <span className="font-medium text-ink">Right to erasure (right to be forgotten):</span> You may
                request deletion of your account and associated personal data. We will complete deletion
                within 30 days of a verified request.
              </li>
              <li>
                <span className="font-medium text-ink">Right to data portability:</span> You may request an export of
                your business data in CSV format. This is also available directly in the dashboard.
              </li>
              <li>
                <span className="font-medium text-ink">Right to object:</span> You may object to certain types of
                processing, including the use of your data for non-essential communications.
              </li>
              <li>
                <span className="font-medium text-ink">Right to lodge a complaint:</span> If you believe your data
                privacy rights have been violated, you may file a complaint with the National Privacy
                Commission of the Philippines at{' '}
                <a href="https://www.privacy.gov.ph" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline underline-offset-2">
                  privacy.gov.ph
                </a>.
              </li>
            </ul>
            <p>
              To exercise any of these rights, contact us at rjamscxx@gmail.com. We will respond
              within 15 business days of receiving your verified request.
            </p>
          </section>

          {/* 9 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">9. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to
              provide the Service. Specifically:
            </p>
            <ul className="space-y-2 pl-5 list-disc marker:text-ink-4">
              <li>Active account data is retained for the duration of your account.</li>
              <li>
                Upon account deletion or cancellation, we retain your data for 30 days to allow
                for data export and error recovery, after which it is permanently deleted.
              </li>
              <li>
                Payment records and transaction logs may be retained for up to 7 years to comply
                with applicable tax and accounting regulations in the Philippines.
              </li>
              <li>
                Anonymized, aggregated usage data that cannot identify you individually may be
                retained indefinitely for product analytics.
              </li>
            </ul>
          </section>

          {/* 10 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">10. Children&apos;s Privacy</h2>
            <p>
              Sizzle is not directed at individuals under 18 years of age. We do not knowingly collect
              personal information from minors. If we become aware that we have collected data from a
              person under 18, we will take steps to delete that information promptly.
            </p>
          </section>

          {/* 11 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy periodically to reflect changes in our practices,
              technology, or legal requirements. When we make material changes, we will notify you
              by email and update the &ldquo;Last updated&rdquo; date at the top of this page. We encourage you
              to review this policy whenever you access the Service to stay informed about how we
              protect your information.
            </p>
          </section>

          {/* 12 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">12. Contact Us</h2>
            <p>
              For any privacy-related questions, requests, or concerns, please contact us at:
            </p>
            <div className="rounded-xl border border-hair bg-surface-2 p-5 space-y-1 text-sm">
              <p className="font-medium text-ink">Sizzle — Privacy Inquiries</p>
              <p>Operated by RJ Cabansay</p>
              <p>Philippines</p>
              <p>
                Email:{' '}
                <a href="mailto:rjamscxx@gmail.com" className="text-accent hover:underline underline-offset-2">
                  rjamscxx@gmail.com
                </a>
              </p>
            </div>
            <p>
              We are committed to resolving privacy concerns and will respond to all inquiries
              within 15 business days.
            </p>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-14 pt-8 border-t border-hair flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-ink-4">© 2026 Sizzle. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs text-ink-4">
            <Link href="/legal/terms" className="hover:text-ink transition-colors">Terms of Service</Link>
            <Link href="/legal/privacy" className="text-accent">Privacy Policy</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
