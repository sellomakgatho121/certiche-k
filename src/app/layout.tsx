import type { Metadata } from 'next';
// Ensure correct import from next/font/google for Geist
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import CertiCheckHeader from '@/components/layout/certicheck-header';

const geistSans = Geist({
  variable: '--font-geist-sans', // This defines the CSS variable name
  subsets: ['latin'],
  // display: 'swap', // Optional: for font display strategy
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono', // This defines the CSS variable name
  subsets: ['latin'],
  // display: 'swap', // Optional
});

export const metadata: Metadata = {
  title: 'Certicheck by NETCAMPUS - Document Verification',
  description: 'AI-powered document analysis and forgery detection.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      {/* Apply the font variable classes to <html> to make CSS variables available */}
      <body className={'font-sans antialiased'}>
        {/* Use Tailwind's font-sans which will now map to Geist Sans */}
        <CertiCheckHeader />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
