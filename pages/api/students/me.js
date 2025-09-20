import dbConnect from '../../../lib/dbConnect';
import Student from '../../../models/Student';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // Extract token from cookies or authorization header
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token (this will throw an error if invalid)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find student by ID from token in Student collection first
    let student = await Student.findById(decoded.userId).select('-password');
    
    // If not found, check User collection for backward compatibility
    if (!student) {
      student = await User.findById(decoded.userId).select('-password');
    }
    
    if (!student) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.status(200).json({
      id: student._id,
      name: student.name,
      email: student.email,
      role: 'student',
      facultyId: student.facultyId || student.studentId,
      firstName: student.firstName,
      lastName: student.lastName
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}