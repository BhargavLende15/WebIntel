import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../context/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email.trim(), password);

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        (!err.response
          ? 'Cannot reach the WebIntel API. Check that the backend is running.'
          : 'Sign-in failed. Check your email and password.')
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
        Welcome back
      </h2>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Sign in to access your WebIntel assessments and reports.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">New to WebIntel? <Link className="font-medium text-primary-600 hover:underline" to="/register">Create an account</Link></p>
      <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Sign in with your WebIntel account to continue.
      </p>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link className="text-primary-600 hover:underline" to="/">
          Back to home
        </Link>
      </p>
    </Card>
  );
}
