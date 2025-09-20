import dbConnect from '../../lib/dbConnect';
import Subject from '../../models/Subject';
import User from '../../models/User';
import Student from '../../models/Student';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  const { method } = req;
  const { facultyId } = req.query; // Get facultyId from query parameters

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        let query = {};
        // If facultyId is provided, filter subjects by assigned faculty
        if (facultyId) {
          // First, try to find the user by facultyId (custom string format)
          const user = await User.findOne({ facultyId: facultyId });
          if (user) {
            // Use the user's ObjectId to query subjects
            query.assignedFaculty = user._id;
          } else {
            // If not found by facultyId, check if it's a valid ObjectId
            if (mongoose.Types.ObjectId.isValid(facultyId)) {
              query.assignedFaculty = new mongoose.Types.ObjectId(facultyId);
            } else {
              return res.status(400).json({ message: 'Invalid faculty ID format' });
            }
          }
        }
        
        // First get the subjects with basic population
        const subjects = await Subject.find(query)
          .populate('assignedFaculty', 'firstName lastName facultyId');
          
        // Manually populate enrolledStudents from both User and Student collections
        const populatedSubjects = [];
        for (let subject of subjects) {
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
          populatedSubjects.push({
            ...subject.toObject(),
            enrolledStudents: populatedStudents
          });
        }
        
        res.status(200).json(populatedSubjects);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: 'Error fetching subjects', error: error.message });
      }
      break;
    case 'POST':
      try {
        let assignedFacultyId = req.body.assignedFaculty;
        
        // Handle assignedFaculty - could be facultyId string or ObjectId
        if (assignedFacultyId) {
          // If it's not a valid ObjectId, treat it as a facultyId string
          if (!mongoose.Types.ObjectId.isValid(assignedFacultyId)) {
            const user = await User.findOne({ facultyId: assignedFacultyId });
            if (user) {
              assignedFacultyId = user._id;
            } else {
              return res.status(400).json({ message: 'Faculty not found for the provided faculty ID' });
            }
          }
        } else {
          return res.status(400).json({ message: 'assignedFaculty is required' });
        }
        
        const subject = await Subject.create({
          ...req.body,
          assignedFaculty: assignedFacultyId
        });
        
        // Populate the faculty details
        const populatedSubject = await Subject.findById(subject._id)
          .populate('assignedFaculty', 'firstName lastName facultyId');
          
        // Manually populate enrolledStudents from both User and Student collections
        const populatedStudents = [];
        for (let studentId of populatedSubject.enrolledStudents) {
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
        const finalSubject = {
          ...populatedSubject.toObject(),
          enrolledStudents: populatedStudents
        };
        
        res.status(201).json(finalSubject);
      } catch (error) {
        if (error.code === 11000) {
          res.status(400).json({ message: 'Subject code already exists' });
        } else {
          console.error('Error creating subject:', error);
          res.status(400).json({ message: 'Error creating subject', error: error.message });
        }
      }
      break;
    default:
      res.status(405).json({ message: 'Method not allowed' });
      break;
  }
}