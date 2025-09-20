import { useEffect, useState } from 'react';
import TeacherLayout from '../../components/TeacherLayout';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setError('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Error fetching user data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          {/* Clean dashboard without cards or excessive text */}
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-500 to-orange-500 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-gray-700 mb-2">Welcome to Your Dashboard</h1>
              <p className="text-gray-500">Select an option from the menu to get started</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </TeacherLayout>
  );
}