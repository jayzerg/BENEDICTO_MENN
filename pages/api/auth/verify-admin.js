import dbConnect from '../../../lib/dbConnect';
import AdminCode from '../../../models/AdminCode';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ 
      valid: false, 
      message: 'Database connection failed. Please check server configuration.',
      error: error.message 
    });
  }

  const { adminCode } = req.body;

  try {
    // Auto-seed admin code if it doesn't exist
    const existingCode = await AdminCode.findOne({ code: '262366' });
    if (!existingCode) {
      await AdminCode.create({ code: '262366', isActive: true });
    }
    
    const validCode = await AdminCode.findOne({ code: adminCode, isActive: true });
    
    if (validCode) {
      res.status(200).json({ valid: true });
    } else {
      res.status(401).json({ valid: false, message: 'Invalid administrator code' });
    }
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ 
      valid: false,
      message: 'Server error during admin verification',
      error: error.message 
    });
  }
}