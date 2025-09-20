import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    console.log('Database connected successfully');

    const { firstName, lastName, facultyId, password } = req.body;
    console.log('Received data:', { firstName, lastName, facultyId, password: '***' });

    // Validate required fields
    if (!firstName || !lastName || !facultyId || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if teacher already exists
    const existingTeacher = await User.findOne({ facultyId });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Teacher with this Faculty ID already exists' });
    }

    // Create teacher with email based on faculty ID
    const email = `${facultyId}@teacher.edu`;
    const name = `${firstName} ${lastName}`;

    const teacher = new User({
      name,
      email,
      password,
      role: 'teacher',
      facultyId,
      firstName,
      lastName
    });

    console.log('About to save teacher:', { name, email, role: 'teacher', facultyId });
    const savedTeacher = await teacher.save();
    console.log('Teacher saved successfully:', savedTeacher._id);

    res.status(201).json({ 
      message: 'Teacher registered successfully',
      teacher: {
        id: savedTeacher._id,
        name: savedTeacher.name,
        facultyId: savedTeacher.facultyId,
        email: savedTeacher.email
      }
    });
  } catch (error) {
    console.error('Error registering teacher:', error);
    res.status(500).json({ message: 'Error registering teacher', error: error.message });
  }
}