# Simple Task Manager — Next.js (App Router) + TypeScript + Supabase + Prisma

> Full project scaffold, code files, and step-by-step Supabase setup.

---

## Project structure

```
simple-task-manager/
├─ .env.example
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
```





> *Notes*: Versions are examples — you can update to latest stable. The code is written with types and common APIs. If you bump versions, run `npm install` then `npx prisma generate`.

---







## app/login/page.tsx (client component for auth)

```tsx
'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // after sign up, Supabase will send confirm email depending on your settings.
        // We redirect to /tasks and Supabase will create a session on successful sign-in.
        router.push('/tasks');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/tasks');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">{isSignUp ? 'Create account' : 'Sign in'}</h2>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@example.com"
          required
          className="w-full p-2 border rounded"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="password"
          required
          className="w-full p-2 border rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-indigo-600 text-white disabled:opacity-60"
        >
          {loading ? 'Working...' : isSignUp ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <div className="mt-4 text-sm text-center">
        <button className="underline" onClick={() => setIsSignUp((s) => !s)}>
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}
```

---

## app/tasks/page.tsx (protected client page — list, create, delete tasks)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Task = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        // not logged in -> redirect to /login
        window.location.assign('/login');
        return;
      }

      try {
        const res = await fetch('/api/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setTasks(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) return setError('Title and description are required');

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return window.location.assign('/login');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: title.trim(), description: description.trim() })
      });

      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      setTasks((t) => [created, ...t]);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    }
  };

  const deleteTask = async (id: string) => {
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return window.location.assign('/login');

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      setTasks((t) => t.filter((task) => task.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.assign('/login');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your Tasks</h1>
        <button onClick={signOut} className="text-sm px-3 py-1 border rounded">Sign out</button>
      </div>

      <section className="mb-6 bg-white p-4 rounded shadow">
        <form onSubmit={createTask} className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            required
            className="w-full p-2 border rounded"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task description"
            required
            className="w-full p-2 border rounded"
          />
          <div>
            <button className="px-4 py-2 rounded bg-indigo-600 text-white">Add Task</button>
          </div>
        </form>
      </section>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul className="space-y-3">
          {tasks.length === 0 && <div className="text-gray-600">No tasks yet — add one above.</div>}
          {tasks.map((t) => (
            <li key={t.id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{t.title}</h3>
                  <p className="text-sm text-gray-700">{t.description}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(t.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <button onClick={() => deleteTask(t.id)} className="text-sm px-3 py-1 border rounded">Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## app/api/tasks/route.ts (GET, POST)

```ts
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

function getTokenFromHeader(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const parts = auth.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
  return null;
}

export async function GET(req: Request) {
  const token = getTokenFromHeader(req);
  if (!token) return new Response('Unauthorized', { status: 401 });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = data?.user;
  if (error || !user) return new Response('Unauthorized', { status: 401 });

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const token = getTokenFromHeader(req);
  if (!token) return new Response('Unauthorized', { status: 401 });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = data?.user;
  if (error || !user) return new Response('Unauthorized', { status: 401 });

  const body = await req.json();
  const { title, description } = body || {};
  if (!title || !description) return new Response('Invalid payload', { status: 400 });

  const created = await prisma.task.create({
    data: {
      title,
      description,
      userId: user.id
    }
  });

  return NextResponse.json(created, { status: 201 });
}
```

---

## app/api/tasks/[id]/route.ts (DELETE)

```ts
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function getTokenFromHeader(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const parts = auth.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
  return null;
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const token = getTokenFromHeader(req);
  if (!token) return new Response('Unauthorized', { status: 401 });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = data?.user;
  if (error || !user) return new Response('Unauthorized', { status: 401 });

  const { id } = params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return new Response('Not found', { status: 404 });
  if (task.userId !== user.id) return new Response('Forbidden', { status: 403 });

  await prisma.task.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
```

---

## styles/globals.css (Tailwind entry)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #__next {
  height: 100%;
}

body {
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
}
```

---

## tailwind.config.js

```js
module.exports = {
  content: ['./app/**/*.{ts,tsx,js,jsx}', './components/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {}
  },
  plugins: []
}
```

---

## postcss.config.js

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## README.md (summary & step-by-step)

````md
# Simple Task Manager

Minimal task manager built with Next.js (App Router), TypeScript, Supabase Auth + Postgres, and Prisma.

## Features
- Sign up / Sign in with email & password (Supabase Auth)
- Create, list, delete tasks (tasks stored in Supabase Postgres)
- Prisma used as ORM to manage the `Task` schema locally
- Route handlers verify Supabase access token server-side (via service role client)
- TailwindCSS for styling

---

## Quick start

1. **Clone the repo**

```bash
git clone <repo-url>
cd simple-task-manager
````

2. **Create a Supabase project**

* Go to [https://app.supabase.com](https://app.supabase.com) and create a new project.
* After project creation:

  * Go to **Settings → API** and copy the `Project URL` (use as `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`) and `anon` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
  * Also copy the **Service role** key (very sensitive) and save it as `SUPABASE_SERVICE_ROLE_KEY` — **do not** expose this in the browser.

3. **Get your database connection string**

* In Supabase, go to **Settings → Database → Connection string** and copy the full connection string (URI).
* Use that as your `DATABASE_URL` in `.env` (example in `.env.example`).

4. **Create `.env` from the example**

```bash
cp .env.example .env
# then open .env and paste your Supabase keys & DB URL
```

5. **Install dependencies**

```bash
npm install
```

6. **Generate Prisma client & run migration**

> Make sure `DATABASE_URL` is set to your Supabase DB connection string before running migrations.

```bash
npx prisma generate
npx prisma migrate dev --name init
```

This will create the `Task` table in your Supabase Postgres DB.

7. **Run the dev server**

```bash
npm run dev
# open http://localhost:3000
```

8. **Usage**

* Visit `/login` to create an account or sign in.
* Visit `/tasks` to manage tasks.

---

## Deployment notes (Vercel)

* On Vercel, add the same env vars to your project settings: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, and `DATABASE_URL`.
* Ensure `DATABASE_URL` is present so Prisma (on build) can run necessary generation. You may prefer to run `prisma generate` during build steps.

---

## Security notes

* Keep `SUPABASE_SERVICE_ROLE_KEY` secret and only use it server-side.
* The API routes verify the client's access token by calling `supabaseAdmin.auth.getUser(token)`; this ensures we only perform DB operations for the authenticated user.
* Optionally enable Row Level Security (RLS) in Supabase and add policies for `tasks` table to further protect data if you're allowing client direct access to tables via Supabase client.

---

## Schema notes

* `Task` model has: `id` (uuid), `title`, `description`, `userId` (Supabase `auth.users.id`), `createdAt`, `updatedAt`.

---

## Troubleshooting

* If `prisma migrate dev` fails due to SSL or connection issues, ensure your `DATABASE_URL` is the full connection string (URI) from Supabase and that your machine can reach the DB host.
* If auth calls fail server-side, verify `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` are correct.

---

## Next improvements you can request

* Protect server-side routes with Next.js middleware for redirects at the router level.
* Add Edit / Update task support.
* Add client-side optimistic UI and better feedback.
* Add tests.

```

---

### Final notes

- This scaffold uses server-side token validation (`supabaseAdmin.auth.getUser(token)`) + Prisma for DB access, which satisfies the requirement that tasks are stored in Supabase Postgres and Prisma manages schema locally.

- If you want, I can also:
  - Create a GitHub repo for you and push this code (I can give the exact `git` commands), or
  - Help wire up deployment to Vercel (env var steps), or
  - Add RLS policies for extra protection.

---

End of project scaffold.

```
