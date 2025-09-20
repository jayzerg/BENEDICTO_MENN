import dbConnect from '../../../lib/dbConnect';
import Student from '../../../models/Student';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    console.log('Database connected successfully');

    const { firstName, lastName, studentId, password } = req.body;
    console.log('Received data:', { firstName, lastName, studentId, password: '***' });

    // Validate required fields
    if (!firstName || !lastName || !studentId || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate student ID format
    if (!/^2025-\d{6}$/.test(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID format. Expected format: 2025-XXXXXX' });
    }

    // Check if student already exists by studentId
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this ID already exists' });
    }

    // Check if student already exists by email
    const email = `${studentId}@student.edu`;
    const existingEmail = await Student.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Student with this email already exists' });
    }

    // Create student
    const student = new Student({
      studentId,
      firstName,
      lastName,
      email,
      password
    });

    console.log('About to save student:', { studentId, email });
    const savedStudent = await student.save();
    console.log('Student saved successfully:', savedStudent._id);

    res.status(201).json({ 
      message: 'Student registered successfully',
      student: {
        id: savedStudent._id,
        name: savedStudent.name,
        studentId: savedStudent.studentId,
        email: savedStudent.email
      }
    });
  } catch (error) {
    console.error('Error registering student:', error);
    res.status(500).json({ message: 'Error registering student', error: error.message });
  }
}