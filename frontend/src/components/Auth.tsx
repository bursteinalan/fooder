import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

type AuthMode = 'login' | 'signup';

export function Auth() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await signup(username, password);
      }
      // Success - AuthContext will update state and user will be redirected
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="auth-subtitle">
          {mode === 'login' 
            ? 'Sign in to access your recipes' 
            : 'Sign up to start managing your recipes'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading 
              ? (mode === 'login' ? 'Signing in...' : 'Creating account...') 
              : (mode === 'login' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-toggle">
          <span>
            {mode === 'login' 
              ? "Don't have an account? " 
              : 'Already have an account? '}
          </span>
          <button 
            type="button"
            onClick={toggleMode}
            className="toggle-link"
            disabled={isLoading}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
