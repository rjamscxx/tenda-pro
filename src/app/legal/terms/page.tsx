import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Tenda Pro',
  description: 'Terms of Service for Tenda Pro, the restaurant and café management dashboard.',
}

export default function TermsPage() {
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
            <span className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">Tenda Pro</span>
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
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Terms of Service</h1>
          <p className="text-sm text-ink-4">Effective date: May 28, 2026 &mdash; Last updated: May 28, 2026</p>
        </div>

        <div className="prose-legal space-y-10 text-ink-3 leading-relaxed">

          <section className="space-y-4">
            <p className="text-base text-ink-3">
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Tenda Pro, a restaurant and
              café management platform operated by RJ Cabansay (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
              By creating an account or using Tenda Pro, you agree to be bound by these Terms. If you do not agree,
              you may not use the service.
            </p>
          </section>

          {/* 1 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">1. Description of Service</h2>
            <p>
              Tenda Pro is a web-based software-as-a-service platform (&ldquo;Service&rdquo;) that provides restaurant and
              café owners with tools to track sales, log expenses, cost menu recipes, manage inventory, process
              payroll, monitor waste, and generate financial reports. The Service is primarily designed for
              food and beverage businesses operating in the Philippines.
            </p>
          </section>

          {/* 2 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">2. Account Registration</h2>
            <p>
              To access Tenda Pro, you must register for an account by providing a valid email address and
              creating a password. You agree to:
            </p>
            <ul className="space-y-2 pl-5 list-disc marker:text-ink-4">
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain the security of your account credentials and not share them with third parties.</li>
              <li>Promptly notify us at rjamscxx@gmail.com if you suspect unauthorized access to your account.</li>
              <li>Accept responsibility for all activity that occurs under your account.</li>
            </ul>
            <p>
              You must be at least 18 years of age to create an account. By registering, you represent
              that you meet this requirement and that you have the authority to bind any business entity
              on whose behalf you are creating the account.
            </p>
          </section>

          {/* 3 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">3. Subscription Plans and Pricing</h2>
            <p>Tenda Pro offers the following subscription tiers:</p>

            <div className="space-y-5">
              <div className="rounded-xl border border-hair bg-surface-2 p-5 space-y-2">
                <p className="text-sm font-semibold text-ink">Basic &mdash; Free</p>
                <p className="text-sm">
                  The Basic plan is free forever for one business. It includes core features such as sales
                  tracking, expense logging, menu management with recipe costing, inventory alerts, 6-month
                  reporting, and all 36 themes. No credit card is required to use the Basic plan.
                </p>
              </div>

              <div className="rounded-xl border border-hair bg-surface-2 p-5 space-y-2">
                <p className="text-sm font-semibold text-ink">Pro &mdash; &#8369;399/month</p>
                <p className="text-sm">
                  The Pro plan includes everything in Basic, plus unlimited dishes and ingredients,
                  employee management, payroll processing, waste log tracking, CSV exports, and
                  priority email support. The Pro plan covers one business and is billed monthly.
                </p>
              </div>

              <div className="rounded-xl border border-hair bg-surface-2 p-5 space-y-2">
                <p className="text-sm font-semibold text-ink">Premium &mdash; &#8369;1,999/month</p>
                <p className="text-sm">
                  The Premium plan includes everything in Pro, plus advanced analytics, revenue
                  forecasting, multi-month P&amp;L reports, dedicated support, and early access to
                  new features. Billing is monthly per account.
                </p>
              </div>
            </div>

            <p>
              Prices are quoted in Philippine Pesos (&#8369;) and are inclusive of all applicable taxes unless
              otherwise stated. We reserve the right to change pricing with at least 30 days&apos; prior notice
              sent to your registered email address.
            </p>
          </section>

          {/* 4 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">4. Free Trial</h2>
            <p>
              New accounts are eligible for a 14-day free trial of the Pro plan. No credit card is required
              to start the trial. At the end of the trial period, your account will automatically revert to
              the Basic (free) plan unless you subscribe to a paid plan. You will not be charged automatically
              at the end of the trial.
            </p>
            <p>
              Each person or business entity is entitled to one free trial. We reserve the right to
              cancel trials we reasonably determine are being claimed fraudulently or in violation of
              these Terms.
            </p>
          </section>

          {/* 5 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">5. Payment and Billing</h2>
            <p>
              Paid subscriptions are billed on a monthly basis, starting from the date you subscribe.
              We currently accept payment through the following methods:
            </p>
            <ul className="space-y-2 pl-5 list-disc marker:text-ink-4">
              <li>GCash</li>
              <li>Maya (formerly PayMaya)</li>
              <li>Credit card and debit card (Visa, Mastercard) via PayMongo</li>
            </ul>
            <p>
              Subscriptions renew automatically each month. You authorize us to charge your selected
              payment method on each renewal date. If a payment fails, we will notify you by email and
              provide a grace period of 7 days to update your payment information before your account
              is downgraded to the Basic plan.
            </p>
            <p>
              All payments are processed securely through PayMongo. We do not store your card
              details or GCash/Maya credentials on our servers.
            </p>
          </section>

          {/* 6 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">6. Refund Policy</h2>
            <p>
              Monthly subscription fees are generally non-refundable once charged. If you believe you
              were billed in error, contact us within 14 days of the charge at rjamscxx@gmail.com and
              we will review your case on a good-faith basis. We may issue a prorated refund at our
              sole discretion.
            </p>
            <p>
              Cancellation of a paid subscription takes effect at the end of your current billing period.
              You retain access to paid features until that date.
            </p>
          </section>

          {/* 7 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">7. Acceptable Use</h2>
            <p>You agree to use Tenda Pro only for lawful purposes and in accordance with these Terms. You must not:</p>
            <ul className="space-y-2 pl-5 list-disc marker:text-ink-4">
              <li>Use the Service to store, transmit, or process data that violates any applicable law.</li>
              <li>Attempt to gain unauthorized access to any part of the Service or its underlying infrastructure.</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Service.</li>
              <li>Use the Service to send unsolicited communications or spam.</li>
              <li>Impersonate another person or entity, or misrepresent your affiliation.</li>
              <li>Upload malicious code, viruses, or any software intended to disrupt the Service.</li>
              <li>Resell, sublicense, or commercialize access to the Service without our written permission.</li>
            </ul>
          </section>

          {/* 8 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">8. Your Data</h2>
            <p>
              All business data you enter into Tenda Pro &mdash; including sales records, menu items, expenses,
              employee information, and inventory &mdash; remains yours. We do not claim ownership of your data.
            </p>
            <p>
              You grant us a limited, non-exclusive license to store and process your data solely for
              the purpose of operating and improving the Service. We will not sell your business data
              to third parties. For full details on how we handle your data, please read our{' '}
              <Link href="/legal/privacy" className="text-accent underline underline-offset-2 hover:no-underline">
                Privacy Policy
              </Link>.
            </p>
          </section>

          {/* 9 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">9. Intellectual Property</h2>
            <p>
              The Tenda Pro name, logo, product design, and all underlying software are the intellectual
              property of RJ Cabansay. Nothing in these Terms grants you any right to use our trademarks,
              brand elements, or proprietary technology outside of your normal use of the Service.
            </p>
          </section>

          {/* 10 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">10. Availability and Uptime</h2>
            <p>
              We aim to maintain high availability but do not guarantee uninterrupted access to the
              Service. We may perform scheduled maintenance, apply updates, or temporarily suspend
              access for technical reasons. We will make reasonable efforts to notify users of
              planned downtime in advance.
            </p>
            <p>
              Tenda Pro is not liable for any loss arising from temporary unavailability of the Service.
            </p>
          </section>

          {/* 11 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">11. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, Tenda Pro and its operators shall not be
              liable for any indirect, incidental, special, consequential, or punitive damages, including
              loss of revenue, loss of data, or business interruption, arising from your use of or inability
              to use the Service.
            </p>
            <p>
              Our total aggregate liability to you for any claims arising under or related to these Terms
              shall not exceed the total amount you paid us in the three months immediately preceding the
              event giving rise to the claim, or &#8369;1,000, whichever is greater.
            </p>
          </section>

          {/* 12 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">12. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either
              express or implied. We do not warrant that the Service will be error-free, secure, or meet
              your specific business requirements. Financial data and calculations generated by Tenda Pro
              are for informational purposes only and should be verified by a qualified accountant before
              being used for tax, legal, or regulatory purposes.
            </p>
          </section>

          {/* 13 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">13. Termination</h2>
            <p>
              You may cancel your account at any time by going to Settings and selecting &ldquo;Delete Account,&rdquo;
              or by emailing us at rjamscxx@gmail.com. Upon cancellation, your data will be retained for
              30 days before permanent deletion, giving you time to export your records.
            </p>
            <p>
              We reserve the right to suspend or terminate your account without notice if we determine
              that you have violated these Terms, engaged in fraudulent activity, or if required by law.
              In such cases, no refund will be issued for unused subscription time.
            </p>
          </section>

          {/* 14 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">14. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. When we make material changes, we will
              notify you via email and update the &ldquo;Last updated&rdquo; date at the top of this page.
              Your continued use of the Service after changes take effect constitutes your acceptance
              of the revised Terms.
            </p>
          </section>

          {/* 15 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">15. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the Republic of the Philippines. Any disputes
              arising out of or related to these Terms or your use of the Service shall be subject
              to the exclusive jurisdiction of the courts of the Philippines.
            </p>
          </section>

          {/* 16 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-ink tracking-tight">16. Contact</h2>
            <p>
              For questions, concerns, or formal notices regarding these Terms, please contact us at:
            </p>
            <div className="rounded-xl border border-hair bg-surface-2 p-5 space-y-1 text-sm">
              <p className="font-medium text-ink">Tenda Pro</p>
              <p>Operated by RJ Cabansay</p>
              <p>Philippines</p>
              <p>
                Email:{' '}
                <a href="mailto:rjamscxx@gmail.com" className="text-accent hover:underline underline-offset-2">
                  rjamscxx@gmail.com
                </a>
              </p>
            </div>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-14 pt-8 border-t border-hair flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-ink-4">© 2026 Tenda Pro. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs text-ink-4">
            <Link href="/legal/terms" className="text-accent">Terms of Service</Link>
            <Link href="/legal/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
