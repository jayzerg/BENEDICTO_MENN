import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('teachers');
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [activeTeachers, setActiveTeachers] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', facultyId: '', role: 'teacher' });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClient, setIsClient] = useState(false);

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

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/users?role=student');
      const data = await response.json();
      setActiveStudents(data.length);
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchStudents();
    const interval = setInterval(() => {
      fetchTeachers();
      fetchStudents();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEdit = (user) => {
    setEditingId(user._id);
    setEditForm({ name: user.name, facultyId: user.facultyId });
  };

  const handleUpdate = async (id) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (response.ok) {
        if (activeTab === 'teachers') {
          setTeachers(teachers.map(t => t._id === id ? { ...t, ...editForm } : t));
        } else {
          setStudents(students.map(s => s._id === id ? { ...s, ...editForm } : s));
        }
        setEditingId(null);
      } else {
        const errorData = await response.json();
        alert(`Error updating user: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (response.ok) {
        if (activeTab === 'teachers') {
          setTeachers(teachers.filter(t => t._id !== id));
        } else {
          setStudents(students.filter(s => s._id !== id));
        }
      } else {
        const errorData = await response.json();
        alert(`Error deleting user: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUser, role: activeTab === 'teachers' ? 'teacher' : 'student' })
      });
      if (response.ok) {
        setAddModalOpen(false);
        setNewUser({ name: '', email: '', password: '', facultyId: '', role: 'teacher' });
        if (activeTab === 'teachers') {
          fetchTeachers();
        } else {
          fetchStudents();
        }
      } else {
        const errorData = await response.json();
        alert(`Error adding user: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error adding user');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <div className="mb-4 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('teachers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'teachers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Teachers ({activeTeachers})
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Students ({activeStudents})
            </button>
          </nav>
        </div>

        {activeTab === 'teachers' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border rounded px-4 py-2 w-full max-w-md"
              />
              <button
                onClick={() => {
                  setNewUser({ name: '', email: '', password: '', facultyId: '', role: 'teacher' });
                  setAddModalOpen(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Teacher
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b text-left">Name</th>
                    <th className="py-2 px-4 border-b text-left">Faculty ID</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers
                    .filter(teacher =>
                      !searchQuery ||
                      teacher.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      teacher.facultyId?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((teacher) => (
                      <tr key={teacher._id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">
                          {editingId === teacher._id ? (
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                              className="border rounded px-2 py-1"
                            />
                          ) : (
                            teacher.name
                          )}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {editingId === teacher._id ? (
                            <input
                              type="text"
                              value={editForm.facultyId}
                              onChange={(e) => setEditForm({...editForm, facultyId: e.target.value})}
                              className="border rounded px-2 py-1"
                            />
                          ) : (
                            teacher.facultyId
                          )}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {editingId === teacher._id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdate(teacher._id)}
                                className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(teacher)}
                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(teacher._id)}
                                className="bg-red-500 text-white px-3 py-1 rounded text-sm"
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
        )}

        {activeTab === 'students' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border rounded px-4 py-2 w-full max-w-md"
              />
              <button
                onClick={() => {
                  setNewUser({ name: '', email: '', password: '', facultyId: '', role: 'student' });
                  setAddModalOpen(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Student
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b text-left">Name</th>
                    <th className="py-2 px-4 border-b text-left">Student ID</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students
                    .filter(student =>
                      !searchQuery ||
                      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      student.facultyId?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">
                          {editingId === student._id ? (
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                              className="border rounded px-2 py-1"
                            />
                          ) : (
                            student.name
                          )}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {editingId === student._id ? (
                            <input
                              type="text"
                              value={editForm.facultyId}
                              onChange={(e) => setEditForm({...editForm, facultyId: e.target.value})}
                              className="border rounded px-2 py-1"
                            />
                          ) : (
                            student.facultyId
                          )}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {editingId === student._id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdate(student._id)}
                                className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(student)}
                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(student._id)}
                                className="bg-red-500 text-white px-3 py-1 rounded text-sm"
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
        )}

        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add New {activeTab === 'teachers' ? 'Teacher' : 'Student'}</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder={activeTab === 'teachers' ? 'Faculty ID' : 'Student ID'}
                  value={newUser.facultyId}
                  onChange={(e) => setNewUser({ ...newUser, facultyId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add {activeTab === 'teachers' ? 'Teacher' : 'Student'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}