import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    // Check user role and redirect to appropriate dashboard
    const checkUserRoleAndRedirect = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const userData = await res.json();
          
          // Redirect based on user role
          switch (userData.role) {
            case 'admin':
              router.push('/admin/dashboard');
              break;
            case 'teacher':
              router.push('/teachers/dashboard');
              break;
            case 'student':
              router.push('/students/dashboard');
              break;
            default:
              router.push('/login');
          }
        } else {
          // If not authenticated, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        router.push('/login');
      }
    };

    checkUserRoleAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}