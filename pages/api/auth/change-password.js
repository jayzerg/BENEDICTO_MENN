import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import Student from '../../../models/Student';
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    // Get token from cookies
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Verify token and get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Connect to database
    await dbConnect();
    
    // Find the user in both User and Student collections
    let user = await User.findById(userId);
    
    // If not found in User collection, check Student collection
    if (!user) {
      user = await Student.findById(userId);
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password using the model's method
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password (the pre-save hook will hash it automatically)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}