# Task Manager

Minimal task manager built with Next.js (App Router), TypeScript, Supabase Auth + Postgres, and Prisma.


// Project structure

simple-task-manager/
├─ .env.local
├─ README.md
├─ package.json
├─ tsconfig.json
├─ tailwind.config.js
├─ postcss.config.js
├─ prisma/
│  └─ schema.prisma
├─ prisma-client/ (generated at runtime)
├─ lib/
│  ├─ prisma.ts
│  ├─ supabaseClient.ts
│  └─ supabaseAdmin.ts
├─ app/
│  ├─ layout.tsx
│  ├─ globals.css
│  ├─ page.tsx
│  ├─ login/page.tsx
│  ├─ tasks/page.tsx
│  └─ api/
│     ├─ tasks/route.ts       (GET, POST)
│     └─ tasks/[id]/route.ts  (DELETE)
└─ styles/
   └─ globals.css (imported by app/layout)

## Features
- Sign up / Sign in with email & password (Supabase Auth)
- Create, list, delete tasks (tasks stored in Supabase Postgres)
- Prisma used as ORM to manage the `Task` schema locally
- Route handlers verify Supabase access token server-side (via service role client)
- TailwindCSS for styling



1. **Clone the repo**

git clone <repo-url>
cd simple-task-manager

2. **Create a Supabase project**

* Go to [https://app.supabase.com](https://app.supabase.com) and create a new project.
* After project creation:

  * Go to **Settings → API** and copy the `Project URL` (use as `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`) and `anon` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).

3. **Get your database connection string**

* In Supabase, go to **Settings → Database → Connection string** and copy the full connection string (URI).
* Use that as your `DATABASE_URL` in `.env` (example in `.env.example`).

4. **Create `.env` file**

cp .env.local
# then open .env and paste your Supabase keys & DB URL

5. **Install dependencies**

npm install

6. **Generate Prisma client & run migration**

> Make sure `DATABASE_URL` is set to your Supabase DB connection string before running migrations.

npx prisma generate
npx prisma migrate dev --name init

This will create the `Task` table in your Supabase Postgres DB.

7. **Run the dev server**

npm run dev
# open http://localhost:3000

8. **Usage**

* Visit `/login` to create an account or sign in.
* Visit `/tasks` to manage tasks.


## Deployment notes (Vercel)

* On Vercel, add the same env vars to your project settings: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, and `DATABASE_URL`.
* Ensure `DATABASE_URL` is present so Prisma (on build) can run necessary generation. 
