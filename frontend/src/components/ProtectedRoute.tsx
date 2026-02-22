import { type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Auth } from './Auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while validating session
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // Show login component if not authenticated
  if (!isAuthenticated) {
    return <Auth />;
  }

  // Render children (main app) if authenticated
  return <>{children}</>;
}
