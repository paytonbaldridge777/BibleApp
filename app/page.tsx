import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-parchment-100">
      {/* Header */}
      <header className="bg-parchment-50 border-b border-parchment-300 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="/icon.svg" alt="Shepherd" width="28" height="28" style={{display:'inline-block', verticalAlign:'middle'}} />
              <span className="text-xl font-bold font-serif text-navy-800">Shepherd</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-ink-600 hover:text-ink-900 font-medium text-sm transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="bg-navy-700 hover:bg-navy-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-gold-100 to-parchment-100 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gold-200 text-navy-800 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span>✦</span> Daily personalized Bible guidance
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif text-ink-900 mb-6 leading-tight">
            Daily Bible Guidance,{' '}
            <span className="text-navy-700">Personalized for You</span>
          </h1>
          <p className="text-lg sm:text-xl text-ink-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Shepherd meets you where you are — whether you're new to Scripture or a seasoned
            reader. Receive daily verses, devotionals, and prayers tailored to your journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-navy-700 hover:bg-navy-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-sm"
            >
              Sign Up Free
            </Link>
            <a
              href="#how-it-works"
              className="border border-parchment-400 hover:border-parchment-400 text-ink-700 bg-parchment-50 hover:bg-parchment-200 px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              Learn More
            </a>
          </div>
          <p className="text-sm text-ink-500 mt-6">Free to use · No credit card required</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-parchment-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold font-serif text-ink-900 mb-4">
              Everything you need for daily Scripture engagement
            </h2>
            <p className="text-ink-600 max-w-xl mx-auto">
              Built around your needs, your pace, and your spiritual journey.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '📖',
                title: 'Personalized Verses',
                desc: 'Scripture selected based on your current needs, struggles, and spiritual goals — not random.',
              },
              {
                icon: '🌅',
                title: 'Daily Devotionals',
                desc: 'Short, meaningful devotionals written in your preferred tone and length, every single day.',
              },
              {
                icon: '🙏',
                title: 'Guided Prayer',
                desc: 'Prayers that reflect your personal journey and the verse for today, helping you speak to God.',
              },
              {
                icon: '🔍',
                title: 'Scripture Study',
                desc: 'Reflection prompts to help you apply Scripture to real life situations you face today.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-parchment-100 rounded-xl p-6 border border-parchment-300 hover:border-gold-400 hover:shadow-sm transition-all"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold font-serif text-ink-900 mb-2">{feature.title}</h3>
                <p className="text-ink-600 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-gold-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold font-serif text-ink-900 mb-4">How Shepherd Works</h2>
            <p className="text-ink-600">Three simple steps to personalized daily guidance.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Share Your Journey',
                desc: 'Answer a short questionnaire about your spiritual background, current needs, and what you\'re seeking.',
              },
              {
                step: '2',
                title: 'Receive Daily Guidance',
                desc: 'Each morning, Shepherd selects a verse and crafts a devotional, prayer, and reflection just for you.',
              },
              {
                step: '3',
                title: 'Grow at Your Pace',
                desc: 'Save favorites, give feedback, and watch your personalization improve over time.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-navy-700 text-white rounded-full flex items-center justify-center text-xl font-bold font-serif mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold font-serif text-ink-900 mb-2 text-lg">{item.title}</h3>
                <p className="text-ink-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-parchment-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-serif text-ink-900 mb-4">
            Begin your guided Scripture journey today
          </h2>
          <p className="text-ink-600 mb-8">
            Join others who start each day anchored in God's Word.
          </p>
          <Link
            href="/auth/signup"
            className="bg-navy-700 hover:bg-navy-800 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-colors shadow-sm inline-block"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 text-navy-200 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <img src="/icon.svg" alt="Shepherd" width="28" height="28" style={{display:'inline-block', verticalAlign:'middle'}} />
            <span className="text-lg font-bold font-serif text-white">Shepherd</span>
          </div>
          <p className="text-navy-300 text-sm leading-relaxed max-w-2xl mb-6">
            <strong className="text-navy-200">Disclaimer:</strong> Shepherd is for spiritual
            encouragement and study assistance only. It is not a substitute for pastoral
            counseling, professional mental health support, or crisis intervention. If you are in
            crisis, please call or text{' '}
            <strong className="text-gold-300">988</strong> (Suicide &amp; Crisis Lifeline) or
            text <strong className="text-gold-300">HOME to 741741</strong> (Crisis Text Line).
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/auth/login" className="hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/auth/signup" className="hover:text-white transition-colors">
              Sign Up
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
          <p className="text-navy-400 text-xs mt-6">
            © {new Date().getFullYear()} Shepherd. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}