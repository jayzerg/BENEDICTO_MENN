import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '', role: 'student', adminCode: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (credentials.role === 'admin') {
      if (!/^\d{6}$/.test(credentials.adminCode)) {
        setError('Administrator code must be exactly 6 digits');
        return;
      }
      
      try {
        const res = await fetch('/api/auth/verify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminCode: credentials.adminCode })
        });
        
        const data = await res.json();
        console.log('Admin verification response:', data);
        
        if (!res.ok) {
          // Handle different types of errors
          if (data.message) {
            setError(`Verification failed: ${data.message}`);
          } else {
            setError('Failed to verify administrator code. Please check server connection.');
          }
          return;
        }
        
        if (data.valid) {
          router.push('/admin/dashboard');
        } else {
          setError(data.message || 'Invalid administrator code');
        }
      } catch (error) {
        console.error('Network error:', error);
        setError(`Network error. Please check your connection to the server. Error: ${error.message}`);
      }
      return;
    }
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await res.json();
      console.log('Login response:', data);
      
      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError(`Network error. Please check your connection to the server. Error: ${error.message}`);
    }
  };

  // Clear error when role changes
  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setCredentials({
      ...credentials,
      role: newRole,
      adminCode: '',
      email: '',
      password: ''
    });
    setError(''); // Clear error when role changes
  };

  // Clear error when email changes
  const handleEmailChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCredentials({
      ...credentials,
      email: value  // Send only the 6-digit ID for both students and teachers
    });
    if (error) setError(''); // Clear error when user starts typing
  };

  // Clear error when password changes
  const handlePasswordChange = (e) => {
    setCredentials({
      ...credentials,
      password: e.target.value
    });
    if (error) setError(''); // Clear error when user starts typing
  };

  // Clear error when admin code changes
  const handleAdminCodeChange = (e) => {
    setCredentials({
      ...credentials,
      adminCode: e.target.value.replace(/\D/g, '').slice(0, 6)
    });
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-orange-500">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 space-y-8 border border-white/20 backdrop-blur-sm">
        <div className="text-center">
          <img src="/BCLOGO.png" alt="BC Logo" className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-orange-500 bg-clip-text text-transparent">Benedicto College</h1>
          <p className="text-gray-600 mt-2 font-medium">Exam Management Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {credentials.role !== 'admin' && (
            <>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                  2025-
                </span>
                <input
                  type="text"
                  placeholder="123456"
                  className="w-full px-4 py-3 pl-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all shadow-sm"
                  value={credentials.email}
                  onChange={handleEmailChange}
                  maxLength="6"
                  required
                />
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all shadow-sm"
                  value={credentials.password}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </>
          )}
          
          {credentials.role === 'admin' && (
            <div className="relative">
              <input
                type={showAdminCode ? "text" : "password"}
                placeholder="6-Digit Administrator Code"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center text-lg tracking-widest transition-all shadow-sm"
                value={credentials.adminCode}
                onChange={handleAdminCodeChange}
                maxLength="6"
                required
              />
              <button
                type="button"
                onClick={() => setShowAdminCode(!showAdminCode)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-500 transition-colors"
              >
                {showAdminCode ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          )}
          
          {/* Error message with even smaller font */}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow-sm text-xs">
              {error}
            </div>
          )}
          
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all shadow-sm"
            value={credentials.role}
            onChange={handleRoleChange}
            required
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Administrator</option>
          </select>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-700 to-orange-500 text-white py-3 px-4 rounded-lg hover:from-blue-800 hover:to-orange-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}