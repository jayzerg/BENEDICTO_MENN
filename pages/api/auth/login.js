import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import Student from '../../../models/Student';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Attempting to connect to database...');
    await dbConnect();
    console.log('Database connection successful');
  } catch (dbError) {
    console.error('Database connection error:', dbError);
    return res.status(500).json({ 
      message: 'Database connection failed', 
      error: dbError.message 
    });
  }

  try {
    const { email, password, role } = req.body;
    console.log('Login attempt:', { email, role });
    console.log('Full request body:', req.body);

    let user;
    
    if (role === 'teacher') {
      // For teachers, login with facultyId
      // Teachers enter 6-digit ID, we need to construct full facultyId
      if (/^\d{6}$/.test(email)) {
        // It's a 6-digit ID, construct the full faculty ID
        const facultyId = `2025-${email}`;
        console.log('Searching for teacher with facultyId:', facultyId);
        user = await User.findOne({ facultyId, role: 'teacher' });
      } else if (email.startsWith('2025-') && /^\d{6}$/.test(email.substring(5))) {
        // It's a full faculty ID (2025-XXXXXX), search by facultyId
        console.log('Searching for teacher with full facultyId:', email);
        user = await User.findOne({ facultyId: email, role: 'teacher' });
      } else {
        // Try direct match
        console.log('Searching for teacher with direct facultyId match:', email);
        user = await User.findOne({ facultyId: email, role: 'teacher' });
      }
    } else if (role === 'admin') {
      // For admin, we use a different verification method
      console.log('Admin login should use verify-admin endpoint');
      return res.status(400).json({ message: 'Admin login should use verify-admin endpoint' });
    } else {
      // For students, login with email or student ID
      console.log('Searching for student with email or student ID:', email);
      // Check if it's a student ID (6 digits) or email
      if (/^\d{6}$/.test(email)) {
        // It's a student ID, construct the full student ID
        const studentId = `2025-${email}`;
        console.log('Searching for student with studentId:', studentId);
        user = await Student.findOne({ studentId });
      } else if (email.startsWith('2025-') && /^\d{6}$/.test(email.substring(5))) {
        // It's a full student ID (2025-XXXXXX), search by studentId
        console.log('Searching for student with full studentId:', email);
        user = await Student.findOne({ studentId: email });
      } else {
        // It's an email, construct the full student email if not already in that format
        const studentEmail = email.endsWith('@student.edu') ? email : `${email}@student.edu`;
        console.log('Searching for student with email:', studentEmail);
        user = await Student.findOne({ email: studentEmail });
      }
      
      // If not found in Student collection, check User collection for backward compatibility
      if (!user) {
        console.log('Student not found in Student collection, checking User collection');
        const studentEmail = email.endsWith('@student.edu') ? email : `${email}@student.edu`;
        user = await User.findOne({ email: studentEmail, role: 'student' });
      }
    }

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials - User not found' });
    }

    console.log('Comparing password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials - Incorrect password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role || role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Set cookie
    res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`);

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || role,
        facultyId: user.facultyId || user.studentId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}