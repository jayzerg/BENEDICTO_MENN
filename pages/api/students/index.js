import dbConnect from '../../../lib/dbConnect';
import Student from '../../../models/Student';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // Fetch students from both collections
    const [studentsFromStudentCollection, studentsFromUserCollection] = await Promise.all([
      Student.find({}).select('studentId firstName lastName'),
      User.find({ role: 'student' }).select('facultyId firstName lastName')
    ]);

    // Combine students from both collections
    const allStudents = [
      ...studentsFromStudentCollection.map(student => ({
        id: student._id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName
      })),
      ...studentsFromUserCollection.map(student => ({
        id: student._id,
        studentId: student.facultyId,
        firstName: student.firstName,
        lastName: student.lastName
      }))
    ];

    res.status(200).json(allStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
}