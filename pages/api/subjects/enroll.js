import dbConnect from '../../../lib/dbConnect';
import Subject from '../../../models/Subject';
import Student from '../../../models/Student';
import User from '../../../models/User';

export default async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'POST':
      try {
        const { subjectId, studentId } = req.body;

        // Validate input
        if (!subjectId || !studentId) {
          return res.status(400).json({ message: 'Subject ID and Student ID are required' });
        }

        // Find the subject
        const subject = await Subject.findById(subjectId);
        if (!subject) {
          return res.status(404).json({ message: 'Subject not found' });
        }

        // Find the student in Student collection first
        let student = await Student.findOne({ 
          studentId: studentId
        });
        
        // If not found, check User collection for backward compatibility
        if (!student) {
          student = await User.findOne({ 
            facultyId: studentId,
            role: 'student'
          });
        }
        
        if (!student) {
          return res.status(404).json({ message: 'Student not found' });
        }

        // Check if student is already enrolled
        if (subject.enrolledStudents.includes(student._id)) {
          return res.status(400).json({ message: 'Student is already enrolled in this subject' });
        }

        // Add student to enrolledStudents array
        subject.enrolledStudents.push(student._id);
        await subject.save();

        // Also add subject to student's enrolledSubjects array
        if (!student.enrolledSubjects) {
          student.enrolledSubjects = [];
        }
        student.enrolledSubjects.push(subject._id);
        await student.save();

        // Populate the assigned faculty details
        const populatedSubject = await Subject.findById(subjectId).populate('assignedFaculty', 'firstName lastName facultyId');

        res.status(200).json({
          message: 'Student enrolled successfully',
          subject: populatedSubject
        });
      } catch (error) {
        console.error('Error enrolling student:', error);
        res.status(500).json({ message: 'Error enrolling student', error: error.message });
      }
      break;

    case 'DELETE':
      try {
        const { subjectId, studentId } = req.body;

        // Validate input
        if (!subjectId || !studentId) {
          return res.status(400).json({ message: 'Subject ID and Student ID are required' });
        }

        // Find the subject
        const subject = await Subject.findById(subjectId);
        if (!subject) {
          return res.status(404).json({ message: 'Subject not found' });
        }

        // Find the student in Student collection first
        let student = await Student.findOne({ 
          studentId: studentId
        });
        
        // If not found, check User collection for backward compatibility
        if (!student) {
          student = await User.findOne({ 
            facultyId: studentId,
            role: 'student'
          });
        }
        
        if (!student) {
          return res.status(404).json({ message: 'Student not found' });
        }

        // Check if student is enrolled
        if (!subject.enrolledStudents.includes(student._id)) {
          return res.status(400).json({ message: 'Student is not enrolled in this subject' });
        }

        // Remove student from enrolledStudents array
        subject.enrolledStudents = subject.enrolledStudents.filter(
          id => id.toString() !== student._id.toString()
        );
        await subject.save();

        // Also remove subject from student's enrolledSubjects array
        if (student.enrolledSubjects) {
          student.enrolledSubjects = student.enrolledSubjects.filter(
            id => id.toString() !== subject._id.toString()
          );
          await student.save();
        }

        // Populate the assigned faculty details
        const populatedSubject = await Subject.findById(subjectId).populate('assignedFaculty', 'firstName lastName facultyId');

        res.status(200).json({
          message: 'Student unenrolled successfully',
          subject: populatedSubject
        });
      } catch (error) {
        console.error('Error unenrolling student:', error);
        res.status(500).json({ message: 'Error unenrolling student', error: error.message });
      }
      break;

    default:
      res.status(405).json({ message: 'Method not allowed' });
      break;
  }
}