import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Function to generate a unique color based on a string
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

// Function to generate initials from name
const getInitials = (name) => {
  if (!name) return 'S';
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials.substring(0, 2);
};

// Function to generate a random password
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default function StudentLayout({ children }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData);
          
          // If user has a profile picture in the database, use it
          if (userData.profilePicture) {
            setProfileImage(userData.profilePicture);
            localStorage.setItem('studentProfileImage', userData.profilePicture);
          } else {
            // Check localStorage for previously uploaded image
            const savedImage = localStorage.getItem('studentProfileImage');
            if (savedImage) {
              setProfileImage(savedImage);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Function to generate a unique avatar SVG
  const generateAvatar = (name, studentId) => {
    const initials = getInitials(name);
    const bgColor = stringToColor(studentId || name || 'student');
    
    // Create SVG as data URI
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="${bgColor}" />
        <text x="50" y="50" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">
          ${initials}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Navbar */}
      <nav className={`${darkMode ? 'bg-gradient-to-r from-blue-800 to-orange-800 border-gray-700' : 'bg-gradient-to-r from-blue-600 to-orange-500'} shadow-sm border-b h-16 fixed w-full top-0 z-10`}>
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center space-x-3">
            <img src="/BCLOGO.png" alt="BC Logo" className="h-16 w-16 relative z-20" />
            <h1 className="text-xl font-bold text-white">Student Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full text-white flex items-center justify-center hover:bg-white/30 transition-colors overflow-hidden"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : currentUser ? (
                  <img 
                    src={generateAvatar(currentUser.name, currentUser.facultyId)} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-white font-bold">S</span>
                )}
              </button>
              
              {showProfileMenu && (
                <div className={`absolute right-0 mt-2 w-48 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg py-2`}>
                  <button 
                    onClick={() => { setShowSettings(true); setShowProfileMenu(false); }}
                    className={`block w-full text-left px-4 py-2 ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100'}`}
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => { setShowChangePassword(true); setShowProfileMenu(false); }}
                    className={`block w-full text-left px-4 py-2 ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100'}`}
                  >
                    Change Password
                  </button>
                  <button
                    onClick={logout}
                    className={`block w-full text-left px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} text-red-600`}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg p-6 w-96 max-w-md`}>
            <h2 className="text-xl font-bold mb-4">Student Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Profile Picture</label>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : currentUser ? (
                      <img 
                        src={generateAvatar(currentUser.name, currentUser.facultyId)} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-gray-600">S</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
                          const reader = new FileReader();
                          reader.onload = async (e) => {
                            const imageData = e.target.result;
                            setProfileImage(imageData);
                            localStorage.setItem('studentProfileImage', imageData);
                            
                            // Save to database if we have a current user
                            if (currentUser) {
                              try {
                                const response = await fetch('/api/users/update-profile-picture', {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    userId: currentUser._id,
                                    profilePicture: imageData
                                  })
                                });
                                
                                if (!response.ok) {
                                  console.error('Failed to save profile picture to database');
                                }
                              } catch (error) {
                                console.error('Error saving profile picture:', error);
                              }
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="profile-upload"
                    />
                    <label
                      htmlFor="profile-upload"
                      className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Upload Image
                    </label>
                    <p className="text-xs text-gray-500 mt-1">JPG or PNG only</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Dark Mode</label>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full ${darkMode ? 'bg-blue-600' : 'bg-gray-300'} relative transition-colors`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setErrorMessage('Settings saved successfully!');
                  setShowSuccessPopup(true);
                  setShowSettings(false);
                  setTimeout(() => setShowSuccessPopup(false), 8000);
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className={`flex-1 py-2 px-4 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg p-6 w-96 max-w-md`}>
            <h2 className="text-xl font-bold mb-4">Change Password</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.current ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={async () => {
                  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    setErrorMessage('New passwords do not match');
                    setShowSuccessPopup(true);
                    setTimeout(() => setShowSuccessPopup(false), 8000);
                    return;
                  }
                  
                  try {
                    const response = await fetch('/api/auth/change-password', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        currentPassword: passwordForm.currentPassword,
                        newPassword: passwordForm.newPassword
                      })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                      setErrorMessage('Password changed successfully!');
                      setShowSuccessPopup(true);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setShowChangePassword(false);
                      setTimeout(() => setShowSuccessPopup(false), 8000);
                    } else {
                      setErrorMessage(data.message || 'Failed to change password');
                      setShowSuccessPopup(true);
                      setTimeout(() => setShowSuccessPopup(false), 8000);
                    }
                  } catch (error) {
                    setErrorMessage('Error changing password. Please try again.');
                    setShowSuccessPopup(true);
                    setTimeout(() => setShowSuccessPopup(false), 8000);
                  }
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Change Password
              </button>
              <button
                onClick={() => {
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setShowChangePassword(false);
                }}
                className={`flex-1 py-2 px-4 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Popup */}
      {showSuccessPopup && (
        <div className="fixed bottom-4 right-4 z-50 transition-opacity duration-500 ease-in-out opacity-100">
          <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 border border-white/20 ${
            errorMessage.includes('successfully') || errorMessage.includes('Success') || errorMessage === '' 
              ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="text-2xl">
              {errorMessage.includes('successfully') || errorMessage.includes('Success') || errorMessage === '' ? '✅' : '❌'}
            </div>
            <div>
              <div className="font-bold">
                {errorMessage.includes('successfully') || errorMessage.includes('Success') || errorMessage === '' ? 'Success!' : 'Error!'}
              </div>
              <div className="text-sm">{errorMessage || 'Operation completed successfully'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-24 p-6">
        {children}
      </main>
    </div>
  );
}