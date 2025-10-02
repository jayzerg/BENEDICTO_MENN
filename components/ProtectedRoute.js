import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';

export default function ProtectedRoute({ children, adminOnly = false, teacherOnly = false }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const userData = await res.json();
        
        // Check role-based access
        if (adminOnly && userData.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
        
        if (teacherOnly && userData.role !== 'teacher') {
          router.push('/dashboard');
          return;
        }
        
        setUser(userData);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [adminOnly, teacherOnly, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return user ? children : null;
}