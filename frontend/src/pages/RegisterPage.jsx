import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../context/useAuth';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password.length < 12) {
      setError('Use a password with at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signUp({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        (!err.response
          ? 'Cannot reach the WebIntel API. Check that the backend is running.'
          : 'Registration failed. Check your details or try signing in.')
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white';

  return (
    <Card className="w-full max-w-md">
      <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
        Create your account
      </h2>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Start assessing website quality with WebIntel.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
            Full name
          </label>
          <input
            id="fullName"
            name="full_name"
            autoComplete="name"
            required
            maxLength={200}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className={inputClass}
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="registerEmail" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="registerEmail"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label htmlFor="registerPassword" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="registerPassword"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
            placeholder="At least 12 characters"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link className="font-medium text-primary-600 hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
