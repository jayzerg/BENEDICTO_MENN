import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

export default function AdminDashboard() {
  const [teachers, setTeachers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [activeTeachers, setActiveTeachers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClient, setIsClient] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editSubjectForm, setEditSubjectForm] = useState({});
  const [showSubjectDeleteModal, setShowSubjectDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  // New state variables for student modal
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [teacherStudents, setTeacherStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  // New state for filtering and sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  // Performance indicators
  const [performanceStats, setPerformanceStats] = useState({
    activeTeachers: 0,
    activeStudents: 0,
    recentActivity: 0
  });
  // User role and permissions
  const [currentUser, setCurrentUser] = useState(null);
  // Drag and drop states
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [grades, setGrades] = useState({});
  const [activeTab, setActiveTab] = useState('drafts'); // 'drafts' or 'grades'

  // Function to save grade
  const saveGrade = async (studentId, subjectId, grade) => {
    try {
      // In a real implementation, this would save to a grades collection
      setGrades(prev => ({
        ...prev,
        [`${studentId}-${subjectId}`]: {
          grade,
          lastSaved: new Date()
        }
      }));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true };
    } catch (error) {
      console.error('Error saving grade:', error);
      return { success: false, error };
    }
  };

  // Function to load drafts
  const loadDrafts = () => {
    // In a real implementation, this would load from a drafts collection
    return drafts;
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/users?role=teacher');
      const data = await response.json();
      setActiveTeachers(data.length);
      
      // Update performance stats
      setPerformanceStats(prev => ({
        ...prev,
        activeTeachers: data.length
      }));
      
      setTeachers(data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  // Fetch all users to get complete stats
  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      // Calculate stats
      const activeTeachers = data.filter(user => user.role === 'teacher').length;
      const activeStudents = data.filter(user => user.role === 'student').length;
      // For recent activity, we'll count users created in the last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentActivity = data.filter(user => new Date(user.createdAt) >= weekAgo).length;
      
      setPerformanceStats({
        activeTeachers,
        activeStudents,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

  // Fetch current user info
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchTeacherSubjects = async (teacherId) => {
    setLoadingSubjects(true);
    try {
      // Fetch teacher details to get facultyId
      const teacherResponse = await fetch(`/api/users/${teacherId}`);
      if (teacherResponse.ok) {
        const teacher = await teacherResponse.json();
        // Use facultyId to fetch subjects
        const response = await fetch(`/api/subjects?facultyId=${encodeURIComponent(teacher.facultyId)}`);
        const subjects = await response.json();
        setTeacherSubjects(subjects);
      } else {
        setTeacherSubjects([]);
      }
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
      setTeacherSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // New function to fetch students for a teacher
  const fetchTeacherStudents = async (teacherId) => {
    setLoadingStudents(true);
    try {
      // First get the teacher details to get facultyId
      const teacherResponse = await fetch(`/api/users/${teacherId}`);
      if (teacherResponse.ok) {
        const teacher = await teacherResponse.json();
        
        // Get all subjects for this teacher
        const subjectsResponse = await fetch(`/api/subjects?facultyId=${encodeURIComponent(teacher.facultyId)}`);
        if (subjectsResponse.ok) {
          const subjects = await subjectsResponse.json();
          
          // Collect all unique enrolled students from all subjects
          const studentIds = new Set();
          subjects.forEach(subject => {
            if (subject.enrolledStudents) {
              subject.enrolledStudents.forEach(student => {
                // Only add valid student objects (not null/undefined)
                if (student && student._id) {
                  studentIds.add(student._id);
                }
              });
            }
          });
          
          // Convert Set to Array
          const uniqueStudentIds = Array.from(studentIds);
          
          // Fetch student details for all enrolled students
          const studentsData = [];
          for (const studentId of uniqueStudentIds) {
            try {
              // Try to fetch from User collection first
              let studentResponse = await fetch(`/api/users/${studentId}`);
              let student;
              
              if (studentResponse.ok) {
                student = await studentResponse.json();
              } else {
                // If not found in User collection, try Student collection
                studentResponse = await fetch(`/api/students/${studentId}`);
                if (studentResponse.ok) {
                  student = await studentResponse.json();
                }
              }
              
              if (student) {
                // Add the assigned teacher information to the student object
                student.assignedTeacher = {
                  id: teacher._id,
                  name: `${teacher.firstName} ${teacher.lastName}`,
                  facultyId: teacher.facultyId
                };
                studentsData.push(student);
              }
            } catch (err) {
              console.error('Error fetching student:', err);
            }
          }
          
          setTeacherStudents(studentsData);
        } else {
          setTeacherStudents([]);
        }
      } else {
        setTeacherStudents([]);
      }
    } catch (error) {
      console.error('Error fetching teacher students:', error);
      setTeacherStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const openSubjectModal = async (teacher) => {
    setSelectedTeacher(teacher);
    setShowSubjectModal(true);
    await fetchTeacherSubjects(teacher._id);
  };

  // New function to open student modal
  const openStudentModal = async (teacher) => {
    setSelectedTeacher(teacher);
    setShowStudentModal(true);
    await fetchTeacherStudents(teacher._id);
  };

  useEffect(() => {
    fetchTeachers();
    fetchAllUsers();
    fetchCurrentUser();
    const interval = setInterval(() => {
      fetchTeachers();
      fetchAllUsers();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEdit = (teacher) => {
    // Check if current user has permission to edit
    if (currentUser && (currentUser.role === 'admin' || currentUser._id === teacher._id)) {
      setEditingId(teacher._id);
      setEditForm({ name: teacher.name, facultyId: teacher.facultyId });
    } else {
      alert('You do not have permission to edit this user.');
    }
  };

  const handleUpdate = async (id) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (response.ok) {
        setTeachers(teachers.map(t => t._id === id ? { ...t, ...editForm } : t));
        setEditingId(null);
      } else {
        const errorData = await response.json();
        alert(`Error updating user: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      alert('Error updating user');
    }
  };

  const handleDelete = async (id) => {
    // Check if current user has permission to delete
    const teacherToDelete = teachers.find(t => t._id === id);
    if (currentUser && currentUser.role === 'admin') {
      try {
        const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setTeachers(teachers.filter(t => t._id !== id));
          setShowDeleteModal(false);
          setTeacherToDelete(null);
        } else {
          const errorData = await response.json();
          alert(`Error deleting user: ${errorData.message}`);
        }
      } catch (error) {
        console.error('Error deleting teacher:', error);
        alert('Error deleting user');
      }
    } else {
      alert('You do not have permission to delete users.');
    }
  };

  // New function to handle subject editing
  const handleEditSubject = (subject) => {
    // Check if current user has permission to edit subjects
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'teacher')) {
      setEditingSubjectId(subject._id);
      setEditSubjectForm({
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        courseLevel: subject.courseLevel,
        prerequisite: subject.prerequisite || ''
      });
    } else {
      alert('You do not have permission to edit subjects.');
    }
  };

  // New function to handle subject update
  const handleUpdateSubject = async (id) => {
    try {
      const response = await fetch(`/api/subjects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSubjectForm)
      });
      
      if (response.ok) {
        const updatedSubject = await response.json();
        setTeacherSubjects(teacherSubjects.map(subject => 
          subject._id === id ? updatedSubject : subject
        ));
        setEditingSubjectId(null);
      } else {
        const error = await response.json();
        console.error('Error updating subject:', error.message);
        alert(`Error updating subject: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating subject:', error);
      alert('Error updating subject');
    }
  };

  // New function to handle subject deletion
  const handleDeleteSubject = async (id) => {
    // Check if current user has permission to delete subjects
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'teacher')) {
      // Find the subject to delete
      const subject = teacherSubjects.find(s => s._id === id);
      setSubjectToDelete(subject);
      setShowSubjectDeleteModal(true);
    } else {
      alert('You do not have permission to delete subjects.');
    }
  };

  // New function to confirm subject deletion
  const confirmDeleteSubject = async () => {
    if (!subjectToDelete) return;
    
    try {
      const response = await fetch(`/api/subjects/${subjectToDelete._id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setTeacherSubjects(teacherSubjects.filter(subject => subject._id !== subjectToDelete._id));
        setShowSubjectDeleteModal(false);
        setSubjectToDelete(null);
      } else {
        const error = await response.json();
        console.error('Error deleting subject:', error.message);
        alert(`Error deleting subject: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Error deleting subject');
    }
  };

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting and filtering
  const sortedAndFilteredTeachers = () => {
    let filtered = teachers.filter(teacher => 
      (!searchQuery || 
        teacher.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.facultyId?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (roleFilter === 'all' || teacher.role === roleFilter)
    );

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(teacher => {
        const createdDate = new Date(teacher.createdAt);
        switch (dateFilter) {
          case 'today':
            return createdDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return createdDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return createdDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  };

  // Get role counts for filter badges
  const getRoleCounts = () => {
    const counts = { all: teachers.length, teacher: 0, student: 0, admin: 0 };
    teachers.forEach(teacher => {
      if (counts[teacher.role] !== undefined) {
        counts[teacher.role]++;
      }
    });
    return counts;
  };

  const roleCounts = getRoleCounts();

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setDateFilter('all');
  };

  // Get performance indicator color based on value
  const getPerformanceColor = (value, thresholds) => {
    if (value >= thresholds.good) return 'bg-green-500';
    if (value >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Check if current user has permission to perform an action
  const hasPermission = (requiredRole) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.role === requiredRole;
  };

  // Get role badge with access control indicator
  const getRoleBadge = (role) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    const roleClasses = {
      teacher: "bg-blue-100 text-blue-800",
      student: "bg-green-100 text-green-800",
      admin: "bg-purple-100 text-purple-800"
    };
    
    return (
      <div className="flex items-center gap-1">
        <span className={`${baseClasses} ${roleClasses[role] || 'bg-gray-100 text-gray-800'}`}>
          {role}
        </span>
        {currentUser && currentUser.role === 'admin' && (
          <span className="text-xs text-gray-500" title="Admin access">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </span>
        )}
      </div>
    );
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem === null) return;
    
    const newTeachers = [...sortedAndFilteredTeachers()];
    const draggedTeacher = newTeachers[draggedItem];
    
    // Remove the dragged item
    newTeachers.splice(draggedItem, 1);
    // Insert it at the new position
    newTeachers.splice(dropIndex, 0, draggedTeacher);
    
    // Update the teachers state (this would need to be saved to the backend)
    setTeachers(newTeachers);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  // Auto-save functionality for drafts
  const [drafts, setDrafts] = useState({});
  const [autoSaveStatus, setAutoSaveStatus] = useState(''); // 'saving', 'saved', 'error'

  // Function to save draft
  const saveDraft = async (teacherId, field, value) => {
    setAutoSaveStatus('saving');
    try {
      // In a real implementation, this would save to a drafts collection
      setDrafts(prev => ({
        ...prev,
        [teacherId]: {
          ...prev[teacherId],
          [field]: value,
          lastSaved: new Date()
        }
      }));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setAutoSaveStatus('saved');
      
      // Clear status after 2 seconds
      setTimeout(() => setAutoSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error saving draft:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus(''), 3000);
    }
  };

  // Debounced draft saving
  const debouncedSaveDraft = (() => {
    let timeout;
    return (teacherId, field, value) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => saveDraft(teacherId, field, value), 1000);
    };
  })();

  // Function to handle grade input change with auto-save
  const handleGradeChange = async (studentId, subjectId, grade) => {
    // Update local state immediately for responsive UI
    setGrades(prev => ({
      ...prev,
      [`${studentId}-${subjectId}`]: {
        grade,
        lastSaved: new Date()
      }
    }));
    
    // Auto-save the grade
    try {
      await saveGrade(studentId, subjectId, grade);
    } catch (error) {
      console.error('Error auto-saving grade:', error);
    }
  };

  return (
    <AdminLayout>
      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500 transition-all duration-300 hover:shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Search active teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-1 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-green-700">Active Teachers</h3>
              <p className="text-3xl font-bold text-green-500">{performanceStats.activeTeachers}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getPerformanceColor(performanceStats.activeTeachers, { good: 20, warning: 10 })}`} 
                style={{ width: `${Math.min(100, performanceStats.activeTeachers * 5)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500 transition-all duration-300 hover:shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Search active students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-1 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-purple-700">Active Students</h3>
              <p className="text-3xl font-bold text-purple-500">{performanceStats.activeStudents}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getPerformanceColor(performanceStats.activeStudents, { good: 100, warning: 50 })}`} 
                style={{ width: `${Math.min(100, performanceStats.activeStudents)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-500 transition-all duration-300 hover:shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Search recent activity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-1 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-orange-700">Recent Activity</h3>
              <p className="text-3xl font-bold text-orange-500">{performanceStats.recentActivity}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getPerformanceColor(performanceStats.recentActivity, { good: 20, warning: 10 })}`} 
                style={{ width: `${Math.min(100, performanceStats.recentActivity * 5)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-xl">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-700 to-blue-600 flex flex-col md:flex-row justify-between items-start md:items-center">
          <h3 className="text-lg font-semibold text-white mb-2 md:mb-0">Teachers Management</h3>
          
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowDraftsModal(true)}
              className="px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-medium hover:bg-yellow-600 transition-colors shadow-sm"
            >
              Drafts ({Object.keys(drafts).length})
            </button>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-3 py-1 bg-white text-blue-700 rounded-full text-xs font-medium hover:bg-blue-50 transition-colors shadow-sm"
            >
              {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-medium hover:bg-orange-600 transition-colors shadow-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Filter</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Filter</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  Showing {sortedAndFilteredTeachers().length} of {teachers.length} teachers
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Role Filter Badges */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Quick Filters:</span>
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              roleFilter === 'all' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({roleCounts.all})
          </button>
          <button
            onClick={() => setRoleFilter('teacher')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              roleFilter === 'teacher' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Teachers ({roleCounts.teacher})
          </button>
          <button
            onClick={() => setRoleFilter('student')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              roleFilter === 'student' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Students ({roleCounts.student})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              roleFilter === 'admin' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Admins ({roleCounts.admin})
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50 sticky top-0 z-10">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    {sortConfig.key === 'name' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('facultyId')}
                >
                  <div className="flex items-center">
                    Faculty ID
                    {sortConfig.key === 'facultyId' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">
                    Role
                    {sortConfig.key === 'role' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Created
                    {sortConfig.key === 'createdAt' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAndFilteredTeachers().map((teacher, index) => (
                <tr 
                  key={teacher._id} 
                  className={`hover:bg-blue-50 transition-colors duration-150 ${dragOverIndex === index ? 'bg-blue-100' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">
                    {editingId === teacher._id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => {
                          setEditForm({...editForm, name: e.target.value});
                          debouncedSaveDraft(teacher._id, 'name', e.target.value);
                        }}
                        className="border rounded px-2 py-1 w-full shadow-sm"
                      />
                    ) : teacher.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === teacher._id ? (
                      <input
                        type="text"
                        value={editForm.facultyId}
                        onChange={(e) => {
                          setEditForm({...editForm, facultyId: e.target.value});
                          debouncedSaveDraft(teacher._id, 'facultyId', e.target.value);
                        }}
                        className="border rounded px-2 py-1 w-full shadow-sm"
                      />
                    ) : teacher.facultyId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getRoleBadge(teacher.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(teacher.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === teacher._id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(teacher._id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                        >
                          Cancel
                        </button>
                        {autoSaveStatus && (
                          <span className={`text-xs ${autoSaveStatus === 'saving' ? 'text-blue-500' : autoSaveStatus === 'saved' ? 'text-green-500' : 'text-red-500'}`}>
                            {autoSaveStatus === 'saving' ? 'Saving...' : autoSaveStatus === 'saved' ? 'Saved' : 'Error'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                          disabled={!hasPermission('admin') && currentUser?._id !== teacher._id}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openSubjectModal(teacher)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                        >
                          View Subject
                        </button>
                        <button
                          onClick={() => openStudentModal(teacher)}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                        >
                          View Students
                        </button>
                        <button
                          onClick={() => {
                            setTeacherToDelete(teacher);
                            setShowDeleteModal(true);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                          disabled={!hasPermission('admin')}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedAndFilteredTeachers().length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500">No teachers found matching your filters.</p>
              <button
                onClick={clearFilters}
                className="mt-2 text-blue-600 hover:text-blue-800 underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Drafts Modal */}
      {showDraftsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Saved Drafts & Grades</h2>
              <button
                onClick={() => setShowDraftsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
              >
                &times;
              </button>
            </div>
            
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex space-x-8">
                <button
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'drafts'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('drafts')}
                >
                  Drafts ({Object.keys(drafts).length})
                </button>
                <button
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'grades'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('grades')}
                >
                  Grades ({Object.keys(grades).length})
                </button>
              </nav>
            </div>
            
            {activeTab === 'drafts' ? (
              Object.keys(drafts).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No drafts saved yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(drafts).map(([teacherId, draft]) => {
                    const teacher = teachers.find(t => t._id === teacherId);
                    return (
                      <div key={teacherId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{teacher?.name || 'Unknown Teacher'}</h3>
                            <div className="mt-2 space-y-1">
                              {Object.entries(draft).map(([field, value]) => (
                                field !== 'lastSaved' && (
                                  <div key={field} className="text-sm">
                                    <span className="font-medium text-gray-700">{field}:</span>
                                    <span className="text-gray-600 ml-2">{value}</span>
                                  </div>
                                )
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Last saved: {draft.lastSaved ? new Date(draft.lastSaved).toLocaleString() : 'Unknown'}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              // Implement draft deletion logic here
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              Object.keys(grades).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No grades saved yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(grades).map(([key, grade]) => {
                    const [studentId, subjectId] = key.split('-');
                    const student = teacherStudents.find(s => s._id === studentId);
                    const subject = teacherSubjects.find(s => s._id === subjectId);
                    return (
                      <div key={key} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{student?.name || 'Unknown Student'}</h3>
                            <div className="mt-2 space-y-1">
                              <div className="text-sm">
                                <span className="font-medium text-gray-700">Subject:</span>
                                <span className="text-gray-600 ml-2">{subject?.subjectName || 'Unknown Subject'}</span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-700">Grade:</span>
                                <span className="text-gray-600 ml-2">{grade.grade}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Last saved: {grade.lastSaved ? new Date(grade.lastSaved).toLocaleString() : 'Unknown'}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              // Implement grade deletion logic here
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Subjects for {selectedTeacher?.name || 'Unknown Teacher'}</h2>
              <button
                onClick={() => setShowSubjectModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
              >
                &times;
              </button>
            </div>
            
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex space-x-8">
                <button
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'subjects'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('subjects')}
                >
                  Subjects ({teacherSubjects.length})
                </button>
                <button
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'add-subject'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('add-subject')}
                >
                  Add Subject
                </button>
              </nav>
            </div>
            
            {activeTab === 'subjects' ? (
              teacherSubjects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No subjects found for this teacher.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teacherSubjects.map(subject => (
                    <div key={subject._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{subject.subjectName}</h3>
                          <div className="mt-2 space-y-1">
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Subject Code:</span>
                              <span className="text-gray-600 ml-2">{subject.subjectCode}</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Course Level:</span>
                              <span className="text-gray-600 ml-2">{subject.courseLevel}</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Prerequisite:</span>
                              <span className="text-gray-600 ml-2">{subject.prerequisite || 'None'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSubject(subject)}
                            className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subject._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Subject Name</label>
                  <input
                    type="text"
                    value={editSubjectForm.subjectName}
                    onChange={(e) => setEditSubjectForm({...editSubjectForm, subjectName: e.target.value})}
                    className="border rounded px-2 py-1 w-full shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Subject Code</label>
                  <input
                    type="text"
                    value={editSubjectForm.subjectCode}
                    onChange={(e) => setEditSubjectForm({...editSubjectForm, subjectCode: e.target.value})}
                    className="border rounded px-2 py-1 w-full shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Course Level</label>
                  <input
                    type="text"
                    value={editSubjectForm.courseLevel}
                    onChange={(e) => setEditSubjectForm({...editSubjectForm, courseLevel: e.target.value})}
                    className="border rounded px-2 py-1 w-full shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Prerequisite</label>
                  <input
                    type="text"
                    value={editSubjectForm.prerequisite}
                    onChange={(e) => setEditSubjectForm({...editSubjectForm, prerequisite: e.target.value})}
                    className="border rounded px-2 py-1 w-full shadow-sm"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleUpdateSubject(editSubjectForm._id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                  >
                    Save Subject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Students for {selectedTeacher?.name || 'Unknown Teacher'}</h2>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
              >
                &times;
              </button>
            </div>
            
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex space-x-8">
                <button
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'students'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('students')}
                >
                  Students ({teacherStudents.length})
                </button>
              </nav>
            </div>
            
            {teacherStudents.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">No students found for this teacher.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teacherStudents.map(student => (
                  <div key={student._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{student.name}</h3>
                        <div className="mt-2 space-y-1">
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Email:</span>
                            <span className="text-gray-600 ml-2">{student.email}</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Enrolled Subjects:</span>
                            <span className="text-gray-600 ml-2">
                              {student.enrolledSubjects?.map(subjectId => {
                                const subject = teacherSubjects.find(s => s._id === subjectId);
                                return subject ? subject.subjectName : 'Unknown Subject';
                              }).join(', ') || 'None'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const teacher = teachers.find(t => t._id === teacherId);
                                if (teacher) {
                                  setEditingId(teacherId);
                                  setEditForm({ name: teacher.name, facultyId: teacher.facultyId });
                                  setShowDraftsModal(false);
                                }
                              }}
                              className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                            >
                              Apply
                            </button>
                            <button
                              onClick={() => {
                                const newDrafts = { ...drafts };
                                delete newDrafts[teacherId];
                                setDrafts(newDrafts);
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              Object.keys(grades).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No grades saved yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(grades).map(([key, gradeData]) => {
                    const [studentId, subjectId] = key.split('-');
                    const student = teacherStudents.find(s => s._id === studentId);
                    const teacher = teachers.find(t => t._id === subjectId);
                    return (
                      <div key={key} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Teacher: {teacher ? teacher.name : 'Unknown Teacher'}
                            </p>
                            <div className="mt-2">
                              <span className="font-medium text-gray-700">Grade:</span>
                              <span className="text-gray-600 ml-2">{gradeData.grade}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Last saved: {gradeData.lastSaved ? new Date(gradeData.lastSaved).toLocaleString() : 'Unknown'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                // Apply grade logic would go here
                              }}
                              className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                            >
                              Apply
                            </button>
                            <button
                              onClick={() => {
                                const newGrades = { ...grades };
                                delete newGrades[key];
                                setGrades(newGrades);
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDraftsModal(false)}
                className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject View Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Subjects for {selectedTeacher?.firstName} {selectedTeacher?.lastName}
              </h2>
              <button
                onClick={() => setShowSubjectModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
              >
                &times;
              </button>
            </div>
            
            {/* Search bar for subjects */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {loadingSubjects ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-700"></div>
                <p className="mt-2 text-gray-600">Loading subjects...</p>
              </div>
            ) : teacherSubjects.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-gray-600">No subjects assigned to this teacher.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prerequisite</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teacherSubjects.map((subject) => (
                      <tr 
                        key={subject._id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {editingSubjectId === subject._id ? (
                            <input
                              type="text"
                              value={editSubjectForm.subjectName}
                              onChange={(e) => setEditSubjectForm({...editSubjectForm, subjectName: e.target.value})}
                              className="border rounded px-2 py-1 w-full shadow-sm"
                            />
                          ) : subject.subjectName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingSubjectId === subject._id ? (
                            <input
                              type="text"
                              value={editSubjectForm.subjectCode}
                              onChange={(e) => setEditSubjectForm({...editSubjectForm, subjectCode: e.target.value})}
                              className="border rounded px-2 py-1 w-full shadow-sm"
                            />
                          ) : subject.subjectCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingSubjectId === subject._id ? (
                            <select
                              value={editSubjectForm.courseLevel}
                              onChange={(e) => setEditSubjectForm({...editSubjectForm, courseLevel: e.target.value})}
                              className="border rounded px-2 py-1 w-full shadow-sm"
                            >
                              <option value="1st Year">1st Year</option>
                              <option value="2nd Year">2nd Year</option>
                              <option value="3rd Year">3rd Year</option>
                              <option value="4th Year">4th Year</option>
                            </select>
                          ) : subject.courseLevel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingSubjectId === subject._id ? (
                            <input
                              type="text"
                              value={editSubjectForm.prerequisite}
                              onChange={(e) => setEditSubjectForm({...editSubjectForm, prerequisite: e.target.value})}
                              className="border rounded px-2 py-1 w-full shadow-sm"
                              placeholder="Prerequisite (optional)"
                            />
                          ) : subject.prerequisite || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingSubjectId === subject._id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateSubject(subject._id)}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingSubjectId(null)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditSubject(subject)}
                                className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                                disabled={!hasPermission('admin') && !hasPermission('teacher')}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(subject._id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs shadow-sm transition-colors"
                                disabled={!hasPermission('admin') && !hasPermission('teacher')}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSubjectModal(false)}
                className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student View Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Students enrolled in {selectedTeacher?.firstName} {selectedTeacher?.lastName}'s subjects
              </h2>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
              >
                &times;
              </button>
            </div>
            
            {/* Search bar for students */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {loadingStudents ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-700"></div>
                <p className="mt-2 text-gray-600">Loading students...</p>
              </div>
            ) : teacherStudents.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-600">No students enrolled in this teacher's subjects.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled Subjects</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teacherStudents.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.studentId || student.facultyId || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {student.enrolledSubjects ? student.enrolledSubjects.length : 0} subjects
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="Enter grade"
                              value={grades[`${student._id}-${selectedTeacher?._id}`]?.grade || ''}
                              onChange={(e) => handleGradeChange(student._id, selectedTeacher?._id, e.target.value)}
                              className="border rounded px-2 py-1 w-20 shadow-sm"
                            />
                            {grades[`${student._id}-${selectedTeacher?._id}`] && (
                              <span className="ml-2 text-xs text-green-600">
                                Saved
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowStudentModal(false)}
                className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md shadow-2xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {teacherToDelete?.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTeacherToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(teacherToDelete._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Delete Confirmation Modal */}
      {showSubjectDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md shadow-2xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {subjectToDelete?.subjectName}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSubjectDeleteModal(false);
                  setSubjectToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSubject}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
