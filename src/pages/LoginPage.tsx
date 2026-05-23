import { FormEvent, useEffect, useState } from 'react';
import { LockKeyhole, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/admin', { replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Signed in');
    navigate('/admin');
  }

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-soft">
      <h1 className="text-2xl font-bold tracking-tight">Admin login</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Use a Supabase Auth email/password user. Any authenticated user can manage polls under the included RLS policy.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Email</span>
          <span className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <Mail size={18} className="text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-w-0 flex-1 outline-none"
              placeholder="admin@example.com"
            />
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Password</span>
          <span className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <LockKeyhole size={18} className="text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-w-0 flex-1 outline-none"
              placeholder="Password"
            />
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
