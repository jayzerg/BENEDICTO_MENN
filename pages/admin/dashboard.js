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

  useEffect(() => {
    fetchTeachers();
    const interval = setInterval(() => {
      fetchTeachers();
    }, 5000);
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
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setTeachers(teachers.filter(t => t._id !== id));
      } else {
        const errorData = await response.json();
        alert(`Error deleting user: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert('Error deleting user');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p className="mb-4">Active Teachers: {activeTeachers}</p>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded px-4 py-2 w-full max-w-md"
          />
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
    </AdminLayout>
  );
}

