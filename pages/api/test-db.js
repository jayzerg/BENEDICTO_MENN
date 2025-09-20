import dbConnect from '../../lib/dbConnect';
import User from '../../models/User';

export default async function handler(req, res) {
  try {
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected successfully');
    
    // Try to fetch users
    const users = await User.find({}).limit(5);
    console.log(`Found ${users.length} users`);
    
    res.status(200).json({
      message: 'Database connection successful',
      userCount: users.length,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        facultyId: user.facultyId
      }))
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
}