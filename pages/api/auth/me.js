import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import Student from '../../../models/Student';
import { verifyToken } from '../../../lib/authMiddleware';

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
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    let user;
    
    // Try to find user in User collection first
    user = await User.findById(decoded.userId).select('-password');
    
    // If not found and role is student, check Student collection
    if (!user && decoded.role === 'student') {
      user = await Student.findById(decoded.userId).select('-password');
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'student',
      facultyId: user.facultyId || user.studentId,
      firstName: user.firstName || user.firstName,
      lastName: user.lastName || user.lastName
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}