import Link from 'next/link';
import PublicHeader from '@/components/layout/PublicHeader';

export const metadata = {
  title: 'Terms of Service — Shepherd',
  description: 'Terms and conditions for using Shepherd.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-parchment-100">
      <PublicHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-bold font-serif text-ink-900 mb-2">Terms of Service</h1>
        <p className="text-ink-500 text-sm mb-10">Effective date: June 1, 2025 &nbsp;·&nbsp; Last updated: June 1, 2025</p>

        <div className="prose prose-sm max-w-none text-ink-700 space-y-8 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">1. Agreement to Terms</h2>
            <p>
              By creating an account or using Shepherd ("the Service"), you agree to be bound by
              these Terms of Service. If you do not agree, please do not use the Service. These
              terms are governed by the laws of the State of Texas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">2. Eligibility</h2>
            <p>
              You must be at least 13 years of age to use Shepherd. By using the Service, you
              represent that you meet this requirement. Users under 18 should have a parent or
              guardian review these terms. We reserve the right to terminate accounts found to
              belong to users under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">3. Description of Service</h2>
            <p>
              Shepherd provides personalized daily Bible guidance including Scripture passages,
              AI-generated devotionals, prayers, and reflection prompts based on a spiritual
              profile you create. Premium features include situational context enhancement,
              customized guidance generation, and Scripture study tools.
            </p>
            <p className="mt-3 font-medium text-ink-800">
              Important: Shepherd is designed for spiritual encouragement and personal Scripture
              engagement only. It is not a substitute for pastoral counseling, professional mental
              health care, crisis intervention, or medical advice. The guidance provided is
              AI-generated and should not be treated as authoritative theological instruction.
              If you are experiencing a mental health crisis, please call or text{' '}
              <strong>988</strong> (Suicide &amp; Crisis Lifeline) or text{' '}
              <strong>HOME to 741741</strong> (Crisis Text Line) immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">4. Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activity that occurs under your account. You agree to provide accurate
              information when creating your account and to keep it current. We reserve the right
              to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">5. Acceptable Use</h2>
            <p>You agree not to use Shepherd to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Attempt to circumvent or abuse premium feature usage limits</li>
              <li>Reverse engineer, scrape, or copy the Service or its AI-generated content at scale</li>
              <li>Submit false, misleading, or harmful content through situational context or customization fields</li>
              <li>Use the Service in any way that violates applicable law</li>
              <li>Attempt to gain unauthorized access to our systems or other users' data</li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate access for any user found to be abusing
              the Service or acting in bad faith.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">6. Shepherd Premium</h2>
            <p>
              Shepherd Premium is a paid subscription that unlocks situational context enhancement,
              customized guidance generation, and Scripture study features. Premium plans are
              available on a monthly ($5.00/month) or annual ($45.00/year) basis.
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Billing</strong> — subscriptions are billed at the beginning of each billing
                period via Stripe. By subscribing, you authorize us to charge your payment method
                on a recurring basis.
              </li>
              <li>
                <strong>Usage limits</strong> — Premium includes 5 uses per month for each of the
                three premium features (context, customization, and study). Limits reset at the
                start of each billing period.
              </li>
              <li>
                <strong>Cancellation</strong> — you may cancel your subscription at any time through
                your account settings. Upon cancellation, you retain Premium access through the end
                of your current billing period. No partial refunds are issued for unused time.
              </li>
              <li>
                <strong>Refunds</strong> — all subscription purchases are final. We do not offer
                refunds for subscription charges. New users are encouraged to evaluate Premium
                features using the free monthly usage allowance before subscribing.
              </li>
              <li>
                <strong>Price changes</strong> — we reserve the right to change subscription prices
                with at least 30 days' notice. Price changes will not affect your current billing
                period.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">7. Donations</h2>
            <p>
              Shepherd accepts voluntary donations to support the continued availability of free
              guidance for all users. Donations are not tax-deductible and do not entitle the donor
              to any additional features or services. All donations are final and non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">8. Intellectual Property</h2>
            <p>
              All content, design, code, and AI-generated output produced by Shepherd is owned by
              or licensed to us. You may use guidance generated for your personal, non-commercial
              spiritual enrichment. You may not reproduce, distribute, or commercialize Shepherd's
              content without written permission.
            </p>
            <p className="mt-3">
              Scripture passages displayed in Shepherd are from the World English Bible (WEB), which
              is in the public domain.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">9. Disclaimers and Limitation of Liability</h2>
            <p>
              Shepherd is provided "as is" without warranties of any kind, express or implied. We
              do not guarantee that the Service will be uninterrupted, error-free, or that
              AI-generated content will be theologically complete or accurate.
            </p>
            <p className="mt-3">
              To the fullest extent permitted by law, Shepherd and its operators shall not be liable
              for any indirect, incidental, special, or consequential damages arising from your use
              of the Service, including but not limited to reliance on AI-generated spiritual
              guidance. Our total liability for any claim arising from use of the Service shall not
              exceed the amount you paid us in the 3 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">10. Governing Law and Disputes</h2>
            <p>
              These terms are governed by the laws of the State of Texas, without regard to conflict
              of law principles. Any disputes arising from these terms or your use of Shepherd shall
              be resolved in the state or federal courts located in Texas, and you consent to
              personal jurisdiction in those courts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">11. Changes to These Terms</h2>
            <p>
              We may update these terms from time to time. When we do, we will update the effective
              date at the top of this page. If changes are material, we will notify you by email.
              Continued use of Shepherd after changes take effect constitutes your acceptance of
              the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-serif text-ink-900 mb-3">12. Contact</h2>
            <p>
              For questions about these terms, contact us at:
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