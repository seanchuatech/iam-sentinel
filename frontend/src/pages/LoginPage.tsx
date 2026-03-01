import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield, Loader2 } from 'lucide-react';

// =============================================================================
// Login Page — Authentication with register toggle
// =============================================================================

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(username, password);
      }
      navigate('/dashboard');
    } catch {
      setError(isRegister ? 'Registration failed. Username may already exist.' : 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-(--color-bg-primary) to-(--color-bg-tertiary)">
      <div className="w-[400px] p-8 rounded-2xl bg-(--color-bg-card) border border-(--color-border) shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <Shield size={28} className="text-(--color-primary-light)" />
            <span className="text-2xl font-bold text-(--color-text-primary)">
              Sentinel
            </span>
          </div>
          <p className="text-sm text-(--color-text-muted)">
            Identity & Access Management
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="px-3.5 py-2.5 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-(--color-danger) text-[13px]">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[13px] font-medium text-(--color-text-secondary) mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) text-(--color-text-primary) text-sm outline-none transition-colors duration-150 focus:border-(--color-primary-light)"
              placeholder="admin"
            />
          </div>

          {isRegister && (
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-(--color-text-secondary) mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) text-(--color-text-primary) text-sm outline-none transition-colors duration-150 focus:border-(--color-primary-light)"
                placeholder="admin@sentinel.io"
              />
            </div>
          )}

          <div className="mb-6">
            <label className="block text-[13px] font-medium text-(--color-text-secondary) mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) text-(--color-text-primary) text-sm outline-none transition-colors duration-150 focus:border-(--color-primary-light)"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg border-none bg-(--color-primary) text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 hover:bg-(--color-primary-light) ${
              loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
            }`}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center mt-5">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="bg-transparent border-none text-(--color-primary-light) text-[13px] cursor-pointer hover:underline"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
