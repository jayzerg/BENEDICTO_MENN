import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import Student from '../../../models/Student';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    await dbConnect();

    if (req.method === 'GET') {
      // Try to find user in User collection first
      let user = await User.findById(id).select('-password');
      
      // If not found, try Student collection
      if (!user) {
        user = await Student.findById(id).select('-password');
      }
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json(user);
    } else if (req.method === 'PUT') {
      const { name, facultyId, profilePicture } = req.body;
      
      // Prepare update object with only provided fields
      const updateFields = {};
      if (name !== undefined) updateFields.name = name;
      if (facultyId !== undefined) updateFields.facultyId = facultyId;
      if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;
      updateFields.updatedAt = new Date();
      
      // Try to update in User collection first
      let updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, select: '-password' } // Don't return the password
      );
      
      // If not found, try Student collection
      if (!updatedUser) {
        updatedUser = await Student.findByIdAndUpdate(
          id,
          { $set: updateFields },
          { new: true, select: '-password' }
        );
      }

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ 
        message: 'User updated successfully',
        user: updatedUser
      });
    } else if (req.method === 'DELETE') {
      // Try to delete from User collection first
      let deletedUser = await User.findByIdAndDelete(id);

      // If not found, try Student collection
      if (!deletedUser) {
        deletedUser = await Student.findByIdAndDelete(id);
      }

      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'User deleted successfully' });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}