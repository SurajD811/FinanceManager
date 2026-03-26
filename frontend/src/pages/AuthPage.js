import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1760442904860-c0016d41ae4d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG1pbmltYWxpc3QlMjB0ZXh0dXJlJTIwbmV1dHJhbCUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc0NTI3MTU5fDA&ixlib=rb-4.1.0&q=85"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <h1 className="text-5xl font-bold tracking-tight mb-4">Welcome to FinanceFlow</h1>
          <p className="text-xl text-white/90 leading-relaxed max-w-md">
            Track your income, expenses, and investments all in one place.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-3 rounded-md hover:bg-surface-muted transition-colors border border-border"
          data-testid="theme-toggle-button"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              {isLogin ? 'Sign in' : 'Create account'}
            </h2>
            <p className="text-sm text-text-secondary">
              {isLogin ? 'Welcome back! Please enter your details.' : 'Get started with your financial journey.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1.5 block" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary transition-all"
                  placeholder="John Doe"
                  required={!isLogin}
                  data-testid="signup-name-input"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-text-secondary mb-1.5 block" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary transition-all"
                placeholder="you@example.com"
                required
                data-testid="auth-email-input"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-secondary mb-1.5 block" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary transition-all"
                placeholder="••••••••"
                required
                data-testid="auth-password-input"
              />
            </div>

            {error && (
              <div className="text-sm text-accent-negative bg-accent-negative/10 border border-accent-negative/20 rounded-md px-4 py-2" data-testid="auth-error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white hover:bg-primary-hover transition-colors rounded-md px-6 py-2.5 font-medium disabled:opacity-50"
              data-testid="auth-submit-button"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Sign up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              data-testid="auth-toggle-button"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}