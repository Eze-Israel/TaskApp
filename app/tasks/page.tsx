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