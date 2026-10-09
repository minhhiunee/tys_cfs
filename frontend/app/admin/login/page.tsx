'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { apiFetch, type ApiError } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      window.location.href = '/admin';
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-[400px]">
        <Card className="border-border shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
               <img src="/logotys-01.png" alt="TYS Logo" className="h-12 w-auto object-contain" />
            </div>
            <CardTitle className="text-[24px] text-navy">Quản trị viên TYS</CardTitle>
            <p className="mt-2 text-[14px] text-text-secondary">
              Đăng nhập để quản lý lời nhắn
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="mt-4 space-y-5">
              {error && (
                <div className="rounded-[8px] border border-error/20 bg-error/5 px-4 py-3 text-[14px] text-error">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-[14px] font-semibold text-navy"
                >
                  Email đăng nhập
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.test"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-[14px] font-semibold text-text-primary"
                >
                  Mật khẩu
                </label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                isLoading={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
