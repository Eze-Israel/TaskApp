import Link from 'next/link';

export default function Home() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-bold mb-4">Simple Task Manager</h1>
      <p className="mb-6">Built with Next.js (App Router), TypeScript, Supabase Auth & Postgres + Prisma</p>

      <div className="space-x-3">
        <Link href="/login" className="px-4 py-2 rounded bg-indigo-600 text-white">Login / Signup</Link>
        <Link href="/tasks" className="px-4 py-2 rounded border border-indigo-600 text-indigo-600">Go to Tasks</Link>
      </div>
    </div>
  );
}

