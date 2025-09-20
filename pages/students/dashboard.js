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
  return `hsl(${hue}, 70%, 90%)`;
};

// Function to get a darker text color for better contrast
const getSubjectTextColor = (subjectId) => {
  let hash = 0;
  for (let i = 0; i < subjectId.length; i++) {
    hash = subjectId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 40%)`;
};

// Function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'draft': return 'bg-gray-200 text-gray-800';
    case 'published': return 'bg-green-200 text-green-800';
    case 'closed': return 'bg-red-200 text-red-800';
    default: return 'bg-gray-200 text-gray-800';
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-600 dark:text-orange">Welcome, {currentUser?.name}</h1>
          <p className="text-gray-600 dark:text-gray-500 mt-2">
            Student ID: {currentUser?.facultyId}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
            <button 
              onClick={fetchEnrolledSubjects}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {examsError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{examsError}</p>
            <button 
              onClick={fetchActiveExams}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enrolled Courses Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Enrolled Courses</h2>
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-semibold">
                {subjectsLoading ? '...' : subjects.length}
              </div>
            </div>
            
            {subjectsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : subjects.length > 0 ? (
              <div className="space-y-5 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700">
                {subjects.map((subject) => (
                  <div 
                    key={subject._id} 
                    className="border border-gray-200 dark:border-gray-600 rounded-xl p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-[1.02]"
                    style={{ 
                      backgroundColor: getSubjectColor(subject._id),
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 
                          className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2"
                          style={{ color: getSubjectTextColor(subject._id) }}
                        >
                          {subject.subjectName}
                        </h3>
                        <p className="text-base mt-1" style={{ color: getSubjectTextColor(subject._id) }}>
                          {subject.subjectCode} • {subject.courseLevel}
                        </p>
                      </div>
                      <span 
                        className="text-xs px-3 py-1.5 rounded-full font-medium"
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
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Courses Enrolled</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your instructors will enroll you in courses soon.
                </p>
              </div>
            )}
            
            <button 
              onClick={fetchEnrolledSubjects}
              className="mt-6 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg"
            >
              Refresh Courses
            </button>
          </div>

          {/* Active Exams Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Active Exams</h2>
              <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-semibold">
                {examsLoading ? '...' : activeExams.length}
              </div>
            </div>
            
            {examsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : activeExams.length > 0 ? (
              <div className="space-y-5 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700">
                {subjects.map((subject) => {
                  const subjectExams = getExamsForSubject(subject._id);
                  return subjectExams.length > 0 ? (
                    <div key={subject._id} className="mb-6">
                      <h3 
                        className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-3"
                        style={{ color: getSubjectTextColor(subject._id) }}
                      >
                        {subject.subjectName}
                      </h3>
                      <div className="space-y-4">
                        {subjectExams.map((exam) => (
                          <div 
                            key={exam._id} 
                            className="border border-gray-200 dark:border-gray-600 rounded-xl p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-[1.01]"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg">
                                  {exam.title}
                                </h4>
                                <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                  </svg>
                                  <span>Duration: {exam.duration} minutes</span>
                                </div>
                                {/* Due date functionality removed and replaced with surveillance */}
                                {exam.surveillance && (
                                  <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    <span>Surveillance: Enabled</span>
                                  </div>
                                )}
                              </div>
                              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getStatusColor(exam.status)}`}>
                                {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                              </span>
                            </div>
                            <div className="mt-4">
                              <Link 
                                href={`/exams/take/${exam._id}`}
                                className="inline-block w-full text-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg"
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
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Active Exams</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your instructors will publish exams soon.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Active Exams</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your instructors will publish exams soon.
                </p>
              </div>
            )}
            
            <button 
              onClick={fetchActiveExams}
              className="mt-6 w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-4 rounded-xl transition-all duration-300 font-medium shadow-md hover:shadow-lg"
            >
              Refresh Exams
            </button>
          </div>
        </div>

        <div className="mt-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Getting Started</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
                Your student dashboard is ready. Your instructors will share exams and assignments with you soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}