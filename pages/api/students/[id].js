import dbConnect from '../../../lib/dbConnect';
import Student from '../../../models/Student';
import User from '../../../models/User';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    await dbConnect();

    if (req.method === 'GET') {
      // Try to find student in Student collection first
      let student = await Student.findById(id).select('-password');
      
      // If not found, try User collection
      if (!student) {
        student = await User.findById(id).select('-password');
      }
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      res.status(200).json(student);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}