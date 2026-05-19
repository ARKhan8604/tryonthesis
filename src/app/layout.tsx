import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Desi Try-On — Virtual Fitting Room',
  description: 'Try on sarees, lehngas and anarkali frocks with AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-xl font-semibold tracking-tight">
              Desi <span className="text-rose-700">Try-On</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link href="/try-on" className="hover:text-rose-700">Try on</Link>
              <Link href="/admin/clothes" className="text-stone-500 hover:text-stone-900">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-stone-500">
            Built as a fashion thesis project. AI-generated try-on results are approximations.
          </div>
        </footer>
      </body>
    </html>
  );
}
