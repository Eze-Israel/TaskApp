
import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Task Manager',
  description: 'Next.js App Router + Supabase Auth + Prisma',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <main className="max-w-3xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
