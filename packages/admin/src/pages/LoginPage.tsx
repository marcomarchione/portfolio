/**
 * Login Page
 *
 * Authentication page with brand styling and glass morphism design.
 */
import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import * as Form from '@radix-ui/react-form';
import { Loader2, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes';
import { ApiError } from '@/lib/api/client';

export default function LoginPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  /**
   * Handle form submission.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
      // Navigation handled by AuthContext
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 bg-neutral-950">
        {/* Primary gradient orb */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        {/* Accent gradient orb */}
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
        {/* Center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full blur-3xl" />
      </div>

      {/* Login card */}
      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-8">
          {/* Brand header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold gradient-text mb-2">
              Marco Marchione
            </h1>
            <p className="text-neutral-400">
              Sign in to access the admin panel
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Login form */}
          <Form.Root onSubmit={handleSubmit} className="space-y-6">
            {/* Username field */}
            <Form.Field name="username" className="space-y-2">
              <Form.Label className="block text-sm font-medium text-neutral-300">
                Username
              </Form.Label>
              <Form.Control asChild>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                />
              </Form.Control>
              <Form.Message match="valueMissing" className="text-sm text-red-400">
                Username is required
              </Form.Message>
            </Form.Field>

            {/* Password field */}
            <Form.Field name="password" className="space-y-2">
              <Form.Label className="block text-sm font-medium text-neutral-300">
                Password
              </Form.Label>
              <div className="relative">
                <Form.Control asChild>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-12 rounded-lg bg-white/5 border border-white/10 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                  />
                </Form.Control>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <Form.Message match="valueMissing" className="text-sm text-red-400">
                Password is required
              </Form.Message>
            </Form.Field>

            {/* Remember me checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500/50 focus:ring-offset-0"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-neutral-400 cursor-pointer"
              >
                Remember me
              </label>
            </div>

            {/* Submit button */}
            <Form.Submit asChild>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-ring"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </>
                )}
              </button>
            </Form.Submit>
          </Form.Root>
        </div>

        {/* Footer */}
        <p className="text-center text-neutral-600 text-sm mt-6">
          Portfolio Content Management System
        </p>
      </div>
    </div>
  );
}
