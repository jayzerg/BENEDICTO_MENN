import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
// Remove the next-auth import since it's not installed in this project

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Since next-auth is not installed, we'll expect the userId in the request body
    // In a production environment, you would implement proper authentication
    const { userId, profilePicture } = req.body;

    if (!userId || !profilePicture) {
      return res.status(400).json({ message: 'User ID and profile picture are required' });
    }

    // Update the user's profile picture
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture },
      { new: true, select: '-password' } // Don't return the password
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
      message: 'Profile picture updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Error updating profile picture', error: error.message });
  }
}