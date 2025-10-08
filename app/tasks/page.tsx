'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
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
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        window.location.assign('/login');
        return;
      }

      try {
        const res = await fetch('/api/tasks', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const json: Task[] = await res.json();
        setTasks(json);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load tasks';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  const createTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setActionLoading(true);

    if (!title.trim() || !description.trim()) {
      Swal.fire('Error', 'Title and description are required', 'error');
      setActionLoading(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return window.location.assign('/login');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const created: Task = await res.json();
      setTasks((prev) => [created, ...prev]);
      setTitle('');
      setDescription('');
      setShowForm(false);

      Swal.fire({
        icon: 'success',
        title: 'Task Created!',
        text: 'Your task was successfully added.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteTask = async (id: string) => {
    const confirmation = await Swal.fire({
      title: 'Are you sure?',
      text: 'This task will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#9333ea',
    });

    if (!confirmation.isConfirmed) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return window.location.assign('/login');

    try {
      setActionLoading(true);
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setTasks((prev) => prev.filter((task) => task.id !== id));

      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Task has been removed.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.assign('/login');
  };

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen text-gray-800 border-4 border-gray-500">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-purple-700 mb-3 sm:mb-0">
          Your Tasks
        </h1>
        <button
          onClick={signOut}
          className="text-sm px-4 py-2 border rounded bg-gray-200 hover:bg-gray-300 transition"
        >
          Sign out
        </button>
      </div>

       {/* Create Task Button  */}
      <div className="mb-6 flex justify-center">
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="px-5 py-2 rounded bg-purple-600 text-white font-medium hover:bg-purple-700 transition"
        >
          {showForm ? 'Close Form' : 'Create Task'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.section
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 bg-white p-4 rounded-lg shadow-md"
          >
            <form onSubmit={createTask} className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                required
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task description"
                required
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition flex items-center justify-center"
                >
                  {actionLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Add Task'
                  )}
                </button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {loading ? (
        <div className="text-center py-6">Loading...</div>
      ) : (
        <ul className="space-y-3">
          {tasks.length === 0 && (
            <div className="text-gray-600 text-center">
              No tasks yet — add one above.
            </div>
          )}
          {tasks.map((t) => (
            <li
              key={t.id}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-semibold text-purple-700">{t.title}</h3>
                  <p className="text-sm text-gray-700">{t.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(t.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteTask(t.id)}
                  disabled={actionLoading}
                  className="text-sm px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
