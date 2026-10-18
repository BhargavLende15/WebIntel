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
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === 'string' && detail.trim() !== ''
          ? detail
          : err.response
            ? 'Sign-in failed. Check your email and password.'
            : 'Cannot reach the WebIntel API. Check that the backend is running.',
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white';

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
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
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
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
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
            className={inputClass}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
          >
            {error}
          </p>
        )}

        <Button className="w-full" size="lg" type="submit" loading={loading}>
          {loading ? 'Signing in' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        New to WebIntel?{' '}
        <Link
          className="font-medium text-primary-600 hover:underline dark:text-primary-400"
          to="/register"
        >
          Create an account
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link className="text-primary-600 hover:underline dark:text-primary-400" to="/">
          Back to home
        </Link>
      </p>
    </Card>
  );
}
