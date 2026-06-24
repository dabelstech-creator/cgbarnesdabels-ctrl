import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Workspace Sync Dashboard',
  description: 'Sync Gmail, Drive, Calendar, and Contacts into Cloud Firestore.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Support google API scripts for Google Picker */}
        <script async defer src="https://apis.google.com/js/api.js"></script>
        <script async defer src="https://accounts.google.com/gsi/client"></script>
      </head>
      <body className="bg-[#030712] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
