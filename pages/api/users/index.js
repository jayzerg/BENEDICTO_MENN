import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import Student from '../../../models/Student';

export default async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'GET':
      try {
        const { role } = req.query;
        let users;

        if (role === 'teacher') {
          users = await User.find({ role: 'teacher' }).select('-password');
        } else if (role === 'student') {
          users = await Student.find({}).select('-password');
        } else {
          const teachers = await User.find({ role: 'teacher' }).select('-password');
          const students = await Student.find({}).select('-password');
          users = [...teachers, ...students];
        }

        res.status(200).json(users);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
      }
      break;

    case 'POST':
      try {
        const { role } = req.body;

        if (role === 'teacher') {
          const newUser = new User(req.body);
          await newUser.save();
          res.status(201).json({ message: 'Teacher created successfully', user: newUser });
        } else if (role === 'student') {
          const newStudent = new Student(req.body);
          await newStudent.save();
          res.status(201).json({ message: 'Student created successfully', user: newStudent });
        } else {
          res.status(400).json({ message: 'Invalid role specified' });
        }
      } catch (error) {
        res.status(500).json({ message: 'Error creating user', error });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}