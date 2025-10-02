import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import React from 'react';
import Image from 'next/image';

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
  if (!name) return 'A';
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials.substring(0, 2);
};

// Function to generate a unique avatar SVG
const generateAvatar = (name) => {
  const initials = getInitials(name);
  const bgColor = stringToColor(name || 'admin');
  
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

export default function AdminLayout({ children }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRegisterTeacher, setShowRegisterTeacher] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    assignedFaculty: '',
    subjectName: '',
    subjectCode: '',
    courseLevel: '',
    prerequisite: ''
  });
  const [faculties, setFaculties] = useState([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [showSuccessSubjectPopup, setShowSuccessSubjectPopup] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [newAdminCode, setNewAdminCode] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [teacherForm, setTeacherForm] = useState({
    lastName: '',
    firstName: '',
    facultyId: '',
    password: ''
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [facultyIdError, setFacultyIdError] = useState('');
  const router = useRouter();
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const savedImage = localStorage.getItem('adminProfileImage');
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Function to fetch faculties from database
  const fetchFaculties = async () => {
    setLoadingFaculties(true);
    try {
      const response = await fetch('/api/users?role=teacher');
      const data = await response.json();
      if (response.ok) {
        setFaculties(data);
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
    } finally {
      setLoadingFaculties(false);
    }
  };

  // Fetch faculties when Add Subject modal opens
  useEffect(() => {
    if (showAddSubject) {
      fetchFaculties();
    }
  }, [showAddSubject]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const openRegisterModal = () => {
    setTeacherForm({
      lastName: '',
      firstName: '',
      facultyId: '',
      password: generatePassword()
    });
    setShowRegisterTeacher(true);
    setShowProfileMenu(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        setProfileImage(imageData);
        localStorage.setItem('adminProfileImage', imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Navbar */}
      <nav className={`${darkMode ? 'bg-gradient-to-r from-blue-900 to-orange-700 border-gray-700' : 'bg-gradient-to-r from-blue-700 to-orange-500'} shadow-lg border-b h-16 fixed w-full top-0 z-10`}>
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center space-x-3">
            <Image src="/BCLOGO.png" alt="BC Logo" width={64} height={64} className="relative z-20" />
            <div>
              <h1 className="text-xl font-bold text-white">Benedicto College</h1>
              <p className="text-xs text-white/80">Admin Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full text-white flex items-center justify-center hover:bg-white/30 transition-all duration-200 overflow-hidden border border-white/20"
              >
                {profileImage ? (
                  <Image src={profileImage} alt="Profile" layout="fill" objectFit="cover" />
                ) : (
                  <Image src={generateAvatar("Administrator")} alt="Profile" layout="fill" objectFit="cover" />
                )}
              </button>
              
              {showProfileMenu && (
                <div className={`absolute right-0 mt-2 w-48 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl py-2 border border-gray-200`}>
                  <button 
                    onClick={() => { setShowSettings(true); setShowProfileMenu(false); }}
                    className={`block w-full text-left px-4 py-2 ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100'}`}
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => { setShowAddSubject(true); setShowProfileMenu(false); }}
                    className={`block w-full text-left px-4 py-2 ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100'}`}
                  >
                    Add Subject
                  </button>
                  <button
                    onClick={openRegisterModal}
                    className={`block w-full text-left px-4 py-2 ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100'}`}
                  >
                    Register User
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
            <h2 className="text-xl font-bold mb-4">Administrator Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Change Admin Code</label>
                <input
                  type="password"
                  placeholder="Enter new 6-digit code"
                  className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  value={newAdminCode}
                  onChange={(e) => setNewAdminCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength="6"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Profile Picture</label>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden relative">
                    {profileImage ? (
                      <Image src={profileImage} alt="Profile" layout="fill" objectFit="cover" />
                    ) : (
                      <Image src={generateAvatar("Administrator")} alt="Profile" layout="fill" objectFit="cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="profile-upload"
                    />
                    <label
                      htmlFor="profile-upload"
                      className="cursor-pointer bg-blue-700 text-white px-3 py-1 rounded text-sm hover:bg-blue-800 transition-colors shadow-sm"
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
                  if (newAdminCode.length === 6) {
                    // Update admin code logic here
                    alert('Admin code updated successfully!');
                  }
                  setShowSettings(false);
                }}
                className="flex-1 bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
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

      {/* Teacher Registration Modal */}
      {showRegisterTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg p-6 w-96 max-w-md`}>
            <h2 className="text-xl font-bold mb-4">Register Teacher</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  value={teacherForm.lastName}
                  onChange={(e) => setTeacherForm({...teacherForm, lastName: e.target.value.replace(/[0-9]/g, '')})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  value={teacherForm.firstName}
                  onChange={(e) => setTeacherForm({...teacherForm, firstName: e.target.value.replace(/[0-9]/g, '')})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Faculty ID Number</label>
                <div className="relative">
                  <span className={`absolute left-3 top-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>2025-</span>
                  <input
                    type="text"
                    placeholder="123456"
                    className={`w-full px-3 py-2 pl-16 border rounded-lg ${facultyIdError ? 'border-red-500 animate-pulse bg-red-50' : darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    value={teacherForm.facultyId.replace('2025-', '')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setTeacherForm({...teacherForm, facultyId: `2025-${value}`});
                      setFacultyIdError('');
                    }}
                    maxLength="6"
                  />
                </div>
                {facultyIdError && (
                  <p className="text-red-500 text-sm mt-1">{facultyIdError}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Generated Password</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    readOnly
                    className={`flex-1 px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} cursor-pointer`}
                    value={teacherForm.password}
                    onDoubleClick={() => {
                      navigator.clipboard.writeText(teacherForm.password);
                      // Optional: Show a visual feedback that the password was copied
                      const originalValue = teacherForm.password;
                      setTeacherForm({...teacherForm, password: 'Copied!'});
                      setTimeout(() => {
                        setTeacherForm({...teacherForm, password: originalValue});
                      }, 1000);
                    }}
                    title="Double-click to copy password"
                  />
                  <button
                    onClick={() => setTeacherForm({...teacherForm, password: generatePassword()})}
                    className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    New
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Double-click password to copy</p>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={async () => {
                  const facultyIdNumber = teacherForm.facultyId.replace('2025-', '');
                  if (facultyIdNumber.length !== 6) {
                    setFacultyIdError('Faculty ID must be exactly 2025- followed by 6 digits');
                    return;
                  }
                  
                  try {
                    const response = await fetch('/api/auth/register-teacher', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(teacherForm),
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                      setShowSuccessPopup(true);
                      setTeacherForm({ firstName: '', lastName: '', facultyId: '', password: generatePassword() });
                      setShowRegisterTeacher(false);
                      setTimeout(() => setShowSuccessPopup(false), 8000);
                    } else {
                      setFacultyIdError('Faculty ID already exists');
                    }
                  } catch (error) {
                    alert('Error registering teacher');
                  }
                }}
                className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
              >
                Register
              </button>
              <button
                onClick={() => setShowRegisterTeacher(false)}
                className={`flex-1 py-2 px-4 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4`}>
            <h2 className="text-xl font-bold mb-4">Add Subject</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Assigned Faculty</label>
                {loadingFaculties ? (
                  <div className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                    Loading faculties...
                  </div>
                ) : (
                  <select
                    className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    value={subjectForm.assignedFaculty}
                    onChange={(e) => setSubjectForm({...subjectForm, assignedFaculty: e.target.value})}
                    required
                  >
                    <option value="">Select a faculty member</option>
                    {faculties.map((faculty) => (
                      <option key={faculty._id} value={faculty._id}>
                        {faculty.firstName} {faculty.lastName} ({faculty.facultyId})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Subject Name</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  value={subjectForm.subjectName}
                  onChange={(e) => setSubjectForm({...subjectForm, subjectName: e.target.value})}
                  placeholder="Enter subject name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Subject Code</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  value={subjectForm.subjectCode}
                  onChange={(e) => setSubjectForm({...subjectForm, subjectCode: e.target.value.toUpperCase()})}
                  placeholder="Enter subject code"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Course Level</label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  value={subjectForm.courseLevel}
                  onChange={(e) => setSubjectForm({...subjectForm, courseLevel: e.target.value})}
                  required
                >
                  <option value="">Select course level</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Prerequisite</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  value={subjectForm.prerequisite}
                  onChange={(e) => setSubjectForm({...subjectForm, prerequisite: e.target.value})}
                  placeholder="Enter prerequisite (optional)"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={async () => {
                  // Add subject logic here
                  try {
                    const response = await fetch('/api/subjects', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(subjectForm),
                    });
                    
                    if (response.ok) {
                      // Reset form and show success message
                      setSubjectForm({
                        assignedFaculty: '',
                        subjectName: '',
                        subjectCode: '',
                        courseLevel: '',
                        prerequisite: ''
                      });
                      setShowAddSubject(false);
                      setShowSuccessSubjectPopup(true);
                      setTimeout(() => setShowSuccessSubjectPopup(false), 8000);
                    } else {
                      const errorData = await response.json();
                      alert(`Error: ${errorData.message}`);
                    }
                  } catch (error) {
                    console.error('Error adding subject:', error);
                    alert('Error adding subject. Please try again.');
                  }
                }}
                className="flex-1 bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
              >
                Add Subject
              </button>
              <button
                onClick={() => setShowAddSubject(false)}
                className={`flex-1 py-2 px-4 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup for Subject */}
      {showSuccessSubjectPopup && (
        <div className="fixed bottom-4 right-4 z-50 transition-opacity duration-500 ease-in-out opacity-100">
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 border border-white/20">
            <div className="text-2xl">✅</div>
            <div>
              <div className="font-bold">Success!</div>
              <div className="text-sm">Subject added successfully</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed bottom-4 right-4 z-50 transition-opacity duration-500 ease-in-out opacity-100">
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 border border-white/20">
            <div className="text-2xl">✅</div>
            <div>
              <div className="font-bold">Success!</div>
              <div className="text-sm">Teacher registered successfully</div>
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