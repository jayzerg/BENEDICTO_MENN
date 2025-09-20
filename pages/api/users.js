import dbConnect from '../../lib/dbConnect';
import User from '../../models/User';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await dbConnect();
      
      const { role, search } = req.query;

      let query = {};
      
      if (role) {
        query.role = role;
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { facultyId: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(query).select('-password'); // Don't return passwords

      res.status(200).json(users);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}