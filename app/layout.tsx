import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shepherd - Personalized Bible Guidance',
  description:
    'Daily Bible guidance personalized for your spiritual journey. Discover verses, devotionals, and prayers tailored to where you are today.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
