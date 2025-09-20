import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">
              Exam Portal
            </Link>
            
            <div className="flex space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/exams" className="text-gray-700 hover:text-blue-600">
                Exams
              </Link>
              <Link href="/results" className="text-gray-700 hover:text-blue-600">
                Results
              </Link>
              <button
                onClick={logout}
                className="text-gray-700 hover:text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main>{children}</main>
    </div>
  );
}