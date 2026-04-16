import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shepherd — Personalized Bible Guidance',
  description:
    'Daily Bible guidance personalized for your spiritual journey. Discover verses, devotionals, and prayers tailored to where you are today.',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/icon-navy.png',
  },
  openGraph: {
    title: 'Shepherd — Guided by Scripture',
    description:
      'Daily personalized Bible guidance. Verses, devotionals, and prayers tailored to your spiritual journey.',
    url: 'https://shepherdscompass.com',
    siteName: 'Shepherd',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Shepherd — Guided by Scripture',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shepherd — Guided by Scripture',
    description: 'Daily personalized Bible guidance tailored to your spiritual journey.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-parchment-100 text-ink-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}