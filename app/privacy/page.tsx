import Link from 'next/link';
import PublicHeader from '@/components/layout/PublicHeader';

export const metadata = {
  title: 'Privacy Policy — Shepherd',
  description: 'How Shepherd collects, uses, and protects your information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-parchment-100">
      <PublicHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-bold font-serif text-ink-900 mb-2">Privacy Policy</h1>
        <p className="text-ink-500 text-sm mb-10">Effective date: June 1, 2025 &nbsp;·&nbsp; Last updated: June 1, 2025</p>

        <div className="prose prose-sm max-w-none text-ink-700 space-y-8 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">1. Who We Are</h2>
            <p>
              Shepherd ("we," "our," or "us") is a personalized daily Bible devotional web application
              operated as an independent service. If you have questions about this policy, you can
              reach us at{' '}
              <a
                href="mailto:shepherdscompass.support@gmail.com"
                className="text-navy-700 hover:underline"
              >
                shepherdscompass.support@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">2. Information We Collect</h2>
            <p>We collect only what is necessary to provide you with personalized guidance:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Account information</strong> — your email address, created when you sign up.
              </li>
              <li>
                <strong>Spiritual profile</strong> — answers you provide during onboarding, including
                your current needs, struggles, Bible experience level, and tone preferences. This
                information is used solely to personalize your daily guidance.
              </li>
              <li>
                <strong>Usage data</strong> — your daily guidance history, saved favorites, feedback
                ratings, and premium feature usage counts.
              </li>
              <li>
                <strong>Payment information</strong> — if you subscribe to Shepherd Premium, payment
                is processed by Stripe. We do not store your credit card number or billing details
                on our servers.
              </li>
              <li>
                <strong>Situational context</strong> — any text you voluntarily share when using the
                context or customization features. This is sent to our AI provider to generate your
                devotional and is not stored beyond what appears in your guidance history.
              </li>
            </ul>
            <p className="mt-3">
              We do not collect your name, phone number, location, or any information beyond what is
              listed above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">3. How We Use Your Information</h2>
            <p>Your information is used exclusively to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Generate and personalize your daily Bible guidance</li>
              <li>Maintain your account and subscription status</li>
              <li>Track premium feature usage against your monthly limits</li>
              <li>Improve passage and theme selection over time based on your feedback</li>
              <li>Respond to support requests you initiate</li>
            </ul>
            <p className="mt-3">
              We do not use your information for advertising, and we do not sell, rent, or share
              your personal information with third parties for their own purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">4. Third-Party Services</h2>
            <p>To operate Shepherd, we share limited data with the following trusted providers:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Supabase</strong> — our database and authentication provider. Your account
                data, profile, and guidance history are stored here.
              </li>
              <li>
                <strong>Anthropic</strong> — the AI provider that generates your devotionals,
                prayers, and reflections. Your spiritual profile and any situational context you
                provide are sent to Anthropic solely for generation purposes.
              </li>
              <li>
                <strong>Stripe</strong> — payment processing for Premium subscriptions. Stripe
                handles all billing data under their own privacy policy.
              </li>
              <li>
                <strong>Cloudflare</strong> — hosting and infrastructure provider for both the
                frontend and backend API.
              </li>
            </ul>
            <p className="mt-3">
              Each of these providers operates under their own privacy policies and security
              practices. We choose providers we trust and limit the data shared with each to only
              what is necessary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">5. Sensitive Information</h2>
            <p>
              Your spiritual profile may include personal and sensitive information such as emotional
              struggles, current life circumstances, and areas of personal need. We treat this
              information with care. It is used only to generate your personalized guidance and is
              never shared beyond the third-party providers listed above, and only for that purpose.
            </p>
            <p className="mt-3">
              We encourage you to share only what you are comfortable sharing. You are never
              required to provide specific details to use Shepherd.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. If you delete your account,
              your personal data will be permanently removed from our systems within 30 days. Stripe
              may retain billing records as required by law independently of your account deletion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">7. Children's Privacy</h2>
            <p>
              Shepherd is available to users aged 13 and older. We do not knowingly collect personal
              information from children under 13. If you believe a child under 13 has created an
              account, please contact us at{' '}
              <a
                href="mailto:shepherdscompass.support@gmail.com"
                className="text-navy-700 hover:underline"
              >
                shepherdscompass.support@gmail.com
              </a>{' '}
              and we will promptly delete the account and associated data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">8. California Privacy Rights (CCPA)</h2>
            <p>
              If you are a California resident, you have the right to:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Know what personal information we have collected about you</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of the sale of your personal information (we do not sell personal information)</li>
              <li>Not be discriminated against for exercising your privacy rights</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a
                href="mailto:shepherdscompass.support@gmail.com"
                className="text-navy-700 hover:underline"
              >
                shepherdscompass.support@gmail.com
              </a>
              . We will respond within 45 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">9. Security</h2>
            <p>
              We take reasonable technical and organizational measures to protect your information,
              including encrypted data transmission, row-level security on our database, and
              restricted access to production systems. No method of transmission over the internet
              is 100% secure, but we are committed to protecting your data to the best of our ability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. When we do, we will update the effective
              date at the top of this page. If changes are significant, we will notify you by email.
              Continued use of Shepherd after changes take effect constitutes acceptance of the
              updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">11. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding your privacy, please contact us at:
            </p>
            <p className="mt-3">
              <a
                href="mailto:shepherdscompass.support@gmail.com"
                className="text-navy-700 hover:underline"
              >
                shepherdscompass.support@gmail.com
              </a>
            </p>
          </section>

        </div>
      </main>

      <footer className="bg-navy-900 text-navy-200 py-8 px-4 mt-16">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/icon-navy.png" alt="Shepherd" width="22" height="22" style={{display:'inline-block', verticalAlign:'middle'}} />
            <img src="/logo.png" alt="Shepherd" style={{height: '28px', width: 'auto', filter: 'brightness(0) invert(1)', opacity: '0.85'}} />
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
          <p className="text-navy-400 text-xs">© {new Date().getFullYear()} Shepherd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}