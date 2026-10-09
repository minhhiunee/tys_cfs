'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import type { AdminInfo } from '../../types';

interface DashboardStats {
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
  POSTED: number;
  HIDDEN: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check auth
    apiFetch<{ admin: AdminInfo }>('/auth/me')
      .then((data) => {
        setAdmin(data.admin);
        // 2. Fetch stats if auth succeeds
        return apiFetch<DashboardStats>('/admin/dashboard/stats');
      })
      .then((data) => setStats(data))
      .catch(() => router.replace('/admin/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    window.location.href = '/admin/login';
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top bar */}
      <header className="border-b border-zinc-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-zinc-900">
            CFS Admin
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{admin.email}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Welcome, {admin.email}.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(['PENDING', 'APPROVED', 'REJECTED', 'POSTED'] as const).map((status) => (
            <div
              key={status}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-5 text-center shadow-sm"
            >
              <p className="text-2xl font-semibold text-zinc-900">
                {stats ? stats[status] : '—'}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
                {status}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
