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

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/users?role=teacher');
      const data = await response.json();
      setActiveTeachers(data.length);
      setTeachers(data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
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
    const interval = setInterval(fetchTeachers, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEdit = (teacher) => {
    setEditingId(teacher._id);
    setEditForm({ name: teacher.name, facultyId: teacher.facultyId });
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
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setTeachers(teachers.filter(t => t._id !== id));
        setShowDeleteModal(false);
        setTeacherToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  // New function to handle subject editing
  const handleEditSubject = (subject) => {
    setEditingSubjectId(subject._id);
    setEditSubjectForm({
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      courseLevel: subject.courseLevel,
      prerequisite: subject.prerequisite || ''
    });
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
    // Find the subject to delete
    const subject = teacherSubjects.find(s => s._id === id);
    setSubjectToDelete(subject);
    setShowSubjectDeleteModal(true);
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

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
          <h3 className="text-lg font-semibold mb-2 text-green-500">Search Teachers</h3>
          <input
            type="text"
            placeholder="Search by name or faculty ID..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-700">
          <h3 className="text-lg font-semibold mb-2 text-blue-700">Active Teachers</h3>
          <p className="text-3xl font-bold text-orange-500">{activeTeachers}</p>
          <p className="text-xs text-gray-500 mt-1">Real-time monitoring</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-500">
          <h3 className="text-lg font-semibold mb-2 text-orange-500">Current Time</h3>
          <p className="text-xl font-bold text-blue-700">{isClient ? currentTime.toLocaleDateString() : '--'}</p>
          <p className="text-2xl font-bold text-orange-500">{isClient ? currentTime.toLocaleTimeString() : '--:--:--'}</p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-700 to-blue-600">
            <h3 className="text-lg font-semibold text-white">Teachers Management</h3>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Faculty ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachers.filter(teacher => 
                  !searchQuery || 
                  teacher.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  teacher.facultyId?.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((teacher) => (
                  <tr key={teacher._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">
                      {editingId === teacher._id ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : teacher.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === teacher._id ? (
                        <input
                          type="text"
                          value={editForm.facultyId}
                          onChange={(e) => setEditForm({...editForm, facultyId: e.target.value})}
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : teacher.facultyId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === teacher._id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(teacher._id)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs shadow-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs shadow-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(teacher)}
                            className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs shadow-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openSubjectModal(teacher)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs shadow-sm"
                          >
                            View Subject
                          </button>
                          <button
                            onClick={() => openStudentModal(teacher)}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs shadow-sm"
                          >
                            View Students
                          </button>
                          <button
                            onClick={() => {
                              setTeacherToDelete(teacher);
                              setShowDeleteModal(true);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs shadow-sm"
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
        </div>

      {/* Subject View Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Subjects for {selectedTeacher?.firstName} {selectedTeacher?.lastName}
              </h2>
              <button
                onClick={() => setShowSubjectModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            
            {loadingSubjects ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-700"></div>
                <p className="mt-2 text-gray-600">Loading subjects...</p>
              </div>
            ) : teacherSubjects.length === 0 ? (
              <div className="text-center py-8">
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
                      <tr key={subject._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {editingSubjectId === subject._id ? (
                            <input
                              type="text"
                              value={editSubjectForm.subjectName}
                              onChange={(e) => setEditSubjectForm({...editSubjectForm, subjectName: e.target.value})}
                              className="border rounded px-2 py-1 w-full"
                            />
                          ) : subject.subjectName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingSubjectId === subject._id ? (
                            <input
                              type="text"
                              value={editSubjectForm.subjectCode}
                              onChange={(e) => setEditSubjectForm({...editSubjectForm, subjectCode: e.target.value})}
                              className="border rounded px-2 py-1 w-full"
                            />
                          ) : subject.subjectCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingSubjectId === subject._id ? (
                            <select
                              value={editSubjectForm.courseLevel}
                              onChange={(e) => setEditSubjectForm({...editSubjectForm, courseLevel: e.target.value})}
                              className="border rounded px-2 py-1 w-full"
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
                              className="border rounded px-2 py-1 w-full"
                              placeholder="Prerequisite (optional)"
                            />
                          ) : subject.prerequisite || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingSubjectId === subject._id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateSubject(subject._id)}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs shadow-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingSubjectId(null)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs shadow-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditSubject(subject)}
                                className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs shadow-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(subject._id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs shadow-sm"
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
                className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Students enrolled in {selectedTeacher?.firstName} {selectedTeacher?.lastName}'s subjects
              </h2>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            
            {loadingStudents ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-700"></div>
                <p className="mt-2 text-gray-600">Loading students...</p>
              </div>
            ) : teacherStudents.length === 0 ? (
              <div className="text-center py-8">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Teacher</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teacherStudents.map((student) => (
                      <tr key={student._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.facultyId || student.studentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.assignedTeacher?.name} ({student.assignedTeacher?.facultyId})
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
                className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Subjects */}
      {showSubjectDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete subject <strong>{subjectToDelete?.subjectName}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmDeleteSubject}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowSubjectDeleteModal(false);
                  setSubjectToDelete(null);
                }}
                className="flex-1 bg-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete teacher <strong>{teacherToDelete?.name}</strong>? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDelete(teacherToDelete._id)}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTeacherToDelete(null);
                }}
                className="flex-1 bg-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}