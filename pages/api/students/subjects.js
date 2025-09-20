import dbConnect from '../../../lib/dbConnect';
import Subject from '../../../models/Subject';
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
    
    // Find student by ID from token
    let student = await Student.findById(decoded.userId).select('-password');
    
    // If not found in Student collection, check User collection for backward compatibility
    if (!student) {
      student = await User.findById(decoded.userId).select('-password');
    }
    
    if (!student) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Find subjects where the student is in the enrolledStudents array
    const subjects = await Subject.find({ enrolledStudents: student._id })
      .populate('assignedFaculty', 'firstName lastName facultyId');

    res.status(200).json(subjects);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Error fetching student subjects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}