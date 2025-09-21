import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import StudentLayout from '../../components/StudentLayout';
import Link from 'next/link';

// Function to generate a consistent color based on subject ID
const getSubjectColor = (subjectId) => {
  // Simple hash function to generate a consistent color
  let hash = 0;
  for (let i = 0; i < subjectId.length; i++) {
    hash = subjectId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL color with consistent saturation and lightness
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 95%)`;
};

// Function to get a darker text color for better contrast
const getSubjectTextColor = (subjectId) => {
  let hash = 0;
  for (let i = 0; i < subjectId.length; i++) {
    hash = subjectId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 35%)`;
};

// Function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'published': return 'bg-green-100 text-green-800';
    case 'closed': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function StudentDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [activeExams, setActiveExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [examsLoading, setExamsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examsError, setExamsError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      fetchEnrolledSubjects();
      fetchActiveExams();
    }
  }, [currentUser]);

  const fetchEnrolledSubjects = async () => {
    setSubjectsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/students/subjects');
      if (res.ok) {
        const subjectsData = await res.json();
        setSubjects(subjectsData);
      } else {
        const errorData = await res.json();
        setError(`Failed to fetch subjects: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Error fetching subjects. Please try again.');
    } finally {
      setSubjectsLoading(false);
    }
  };

  const fetchActiveExams = async () => {
    setExamsLoading(true);
    setExamsError(null);
    try {
      const res = await fetch('/api/exams');
      if (res.ok) {
        const allExams = await res.json();
        // Filter for published exams only
        const publishedExams = allExams.filter(exam => exam.status === 'published');
        setActiveExams(publishedExams);
      } else {
        const errorData = await res.json();
        setExamsError(`Failed to fetch exams: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      setExamsError('Error fetching exams. Please try again.');
    } finally {
      setExamsLoading(false);
    }
  };

  // Function to get exams for a specific subject
  const getExamsForSubject = (subjectId) => {
    return activeExams.filter(exam => exam.subject && exam.subject._id === subjectId);
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome, {currentUser?.name}</h1>
          <p className="text-gray-600 mt-1">
            Student ID: {currentUser?.facultyId}
          </p>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{error}</span>
            </div>
            <button 
              onClick={fetchEnrolledSubjects}
              className="mt-3 bg-red-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {examsError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{examsError}</span>
            </div>
            <button 
              onClick={fetchActiveExams}
              className="mt-3 bg-red-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrolled Courses Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-5 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">My Enrolled Courses</h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                  {subjectsLoading ? '...' : subjects.length}
                </span>
              </div>
            </div>
            
            <div className="p-5">
              {subjectsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : subjects.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {subjects.map((subject) => (
                    <div 
                      key={subject._id} 
                      className="border border-gray-200 rounded-lg p-4 transition-all duration-200 hover:border-blue-300 hover:shadow-sm"
                      style={{ 
                        backgroundColor: getSubjectColor(subject._id),
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 
                            className="font-semibold text-gray-900 mb-1"
                            style={{ color: getSubjectTextColor(subject._id) }}
                          >
                            {subject.subjectName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {subject.subjectCode} • {subject.courseLevel}
                          </p>
                        </div>
                        <span 
                          className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap"
                          style={{ 
                            backgroundColor: getSubjectTextColor(subject._id),
                            color: getSubjectColor(subject._id)
                          }}
                        >
                          {subject.assignedFaculty?.firstName} {subject.assignedFaculty?.lastName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No Courses Enrolled</h3>
                  <p className="text-gray-600 text-sm">
                    Your instructors will enroll you in courses soon.
                  </p>
                </div>
              )}
              
              <button 
                onClick={fetchEnrolledSubjects}
                className="mt-4 w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg transition-all duration-300 font-medium hover:bg-gray-50 hover:border-gray-400"
              >
                Refresh Courses
              </button>
            </div>
          </div>

          {/* Active Exams Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-5 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Active Exams</h2>
                <span className="bg-green-100 text-green-800 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                  {examsLoading ? '...' : activeExams.length}
                </span>
              </div>
            </div>
            
            <div className="p-5">
              {examsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : activeExams.length > 0 ? (
                <div className="space-y-5 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {subjects.map((subject) => {
                    const subjectExams = getExamsForSubject(subject._id);
                    return subjectExams.length > 0 ? (
                      <div key={subject._id} className="mb-5">
                        <h3 
                          className="font-semibold text-gray-900 mb-3"
                          style={{ color: getSubjectTextColor(subject._id) }}
                        >
                          {subject.subjectName}
                        </h3>
                        <div className="space-y-3">
                          {subjectExams.map((exam) => (
                            <div 
                              key={exam._id} 
                              className="border border-gray-200 rounded-lg p-4 transition-all duration-200 hover:border-green-300 hover:shadow-sm"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {exam.title}
                                  </h4>
                                  <div className="flex items-center mt-2 text-sm text-gray-600">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <span>Duration: {exam.duration} minutes</span>
                                  </div>
                                  {exam.surveillance && (
                                    <div className="flex items-center mt-1 text-sm text-gray-600">
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                      </svg>
                                      <span>Surveillance: Enabled</span>
                                    </div>
                                  )}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(exam.status)}`}>
                                  {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                                </span>
                              </div>
                              <div className="mt-3">
                                <Link 
                                  href={`/exams/take/${exam._id}`}
                                  className="inline-block w-full text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg transition-all duration-300 font-medium hover:from-blue-700 hover:to-blue-800 hover:shadow-sm"
                                >
                                  Take Exam
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })}
                  {activeExams.filter(exam => {
                    // Check if exam belongs to any of the enrolled subjects
                    return subjects.some(subject => subject._id === (exam.subject && exam.subject._id));
                  }).length === 0 && (
                    <div className="text-center py-6">
                      <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">No Active Exams</h3>
                      <p className="text-gray-600 text-sm">
                        Your instructors will publish exams soon.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No Active Exams</h3>
                  <p className="text-gray-600 text-sm">
                    Your instructors will publish exams soon.
                  </p>
                </div>
              )}
              
              <button 
                onClick={fetchActiveExams}
                className="mt-4 w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg transition-all duration-300 font-medium hover:bg-gray-50 hover:border-gray-400"
              >
                Refresh Exams
              </button>
            </div>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Getting Started</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Your student dashboard is ready. Your instructors will share exams and assignments with you soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}