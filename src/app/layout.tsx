
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import CertiCheckHeader from '@/components/layout/certicheck-header';

const geistSans = Geist({
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
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
    <html lang="en" className={`${geistSans.className} ${geistMono.className}`}>
      <body className={'font-sans antialiased'}>
        <CertiCheckHeader />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
