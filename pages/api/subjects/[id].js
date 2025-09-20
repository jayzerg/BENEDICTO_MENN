import dbConnect from '../../../lib/dbConnect';
import Subject from '../../../models/Subject';
import User from '../../../models/User';
import Student from '../../../models/Student';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        // First get the subject with basic population
        const subject = await Subject.findById(id)
          .populate('assignedFaculty', 'firstName lastName facultyId');
          
        if (!subject) {
          return res.status(404).json({ message: 'Subject not found' });
        }
          
        // Manually populate enrolledStudents from both User and Student collections
        const populatedStudents = [];
        for (let studentId of subject.enrolledStudents) {
          // Try to find in User collection first
          let student = await User.findById(studentId).select('name firstName lastName facultyId email');
          // If not found, try Student collection
          if (!student) {
            student = await Student.findById(studentId).select('name firstName lastName facultyId email studentId');
          }
          // Only add valid student objects
          if (student) {
            populatedStudents.push(student);
          }
        }
        
        // Create a new object with populated data
        const populatedSubject = {
          ...subject.toObject(),
          enrolledStudents: populatedStudents
        };
        
        res.status(200).json(populatedSubject);
      } catch (error) {
        console.error('Error fetching subject:', error);
        res.status(500).json({ message: 'Error fetching subject', error: error.message });
      }
      break;
    case 'PUT':
      try {
        // Handle assignedFaculty - could be facultyId string or ObjectId
        if (req.body.assignedFaculty) {
          // If it's not a valid ObjectId, treat it as a facultyId string
          if (!mongoose.Types.ObjectId.isValid(req.body.assignedFaculty)) {
            const user = await User.findOne({ facultyId: req.body.assignedFaculty });
            if (user) {
              req.body.assignedFaculty = user._id;
            } else {
              return res.status(400).json({ message: 'Faculty not found for the provided faculty ID' });
            }
          }
        }
        
        const subject = await Subject.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true
        }).populate('assignedFaculty', 'firstName lastName facultyId')
          .populate('enrolledStudents', 'name facultyId');
        
        if (!subject) {
          return res.status(404).json({ message: 'Subject not found' });
        }
        
        res.status(200).json(subject);
      } catch (error) {
        if (error.code === 11000) {
          return res.status(400).json({ message: 'Subject code already exists' });
        }
        console.error('Error updating subject:', error);
        res.status(500).json({ message: 'Error updating subject', error: error.message });
      }
      break;
    case 'DELETE':
      try {
        const subject = await Subject.findByIdAndDelete(id);
        
        if (!subject) {
          return res.status(404).json({ message: 'Subject not found' });
        }
        
        res.status(200).json({ message: 'Subject deleted successfully' });
      } catch (error) {
        console.error('Error deleting subject:', error);
        res.status(500).json({ message: 'Error deleting subject', error: error.message });
      }
      break;
    default:
      res.status(405).json({ message: 'Method not allowed' });
      break;
  }
}