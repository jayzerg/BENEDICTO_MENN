import dbConnect from '../../lib/dbConnect';
import Exam from '../../models/Exam';
import Subject from '../../models/Subject';
import User from '../../models/User';

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const exams = await Exam.find({}).populate('createdBy', 'firstName lastName facultyId').populate('subject');
        console.log('Exams fetched with populated data:', exams);
        // Log details about subject population
        exams.forEach(exam => {
          console.log(`Exam: ${exam.title}, Subject:`, exam.subject);
        });
        res.status(200).json(exams);
      } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).json({ message: 'Error fetching exams', error: error.message });
      }
      break;
    case 'POST':
      try {
        // Log the incoming data for debugging
        console.log('Incoming exam data:', req.body);
        
        // Process the exam data to handle different question types
        const examData = { ...req.body };
        
        // Process questions based on their type
        if (examData.questions) {
          examData.questions = examData.questions.map(question => {
            // For multiple-choice questions, ensure correctAnswer is a number
            if (question.type === 'multiple-choice' && typeof question.correctAnswer === 'string') {
              question.correctAnswer = parseInt(question.correctAnswer);
            }
            // For text-based and coding questions, correctAnswer can remain a string
            // Process attachments to ensure proper format
            if (question.attachments) {
              question.attachments = question.attachments.map(attachment => ({
                name: attachment.name || '',
                url: attachment.url || '',
                type: attachment.type || ''
              }));
            }
            return question;
          });
        }
        
        // Log processed data
        console.log('Processed exam data:', examData);
        
        // Validate required fields
        if (!examData.title) {
          return res.status(400).json({ message: 'Exam title is required' });
        }
        console.log('Title validation passed');
        
        if (!examData.createdBy) {
          return res.status(400).json({ message: 'Created by user is required' });
        }
        console.log('CreatedBy validation passed:', examData.createdBy);
        
        if (!examData.subject) {
          return res.status(400).json({ message: 'Subject is required' });
        }
        console.log('Subject validation passed:', examData.subject);
        
        // Validate duration
        if (examData.duration === undefined || examData.duration <= 0) {
          return res.status(400).json({ message: 'Duration must be a positive number' });
        }
        console.log('Duration validation passed');
        
        // Validate that the subject exists
        const subject = await Subject.findById(examData.subject);
        if (!subject) {
          return res.status(400).json({ message: 'Invalid subject ID' });
        }
        console.log('Subject exists validation passed');
        
        // Validate that the creator exists
        const creator = await User.findById(examData.createdBy);
        if (!creator) {
          return res.status(400).json({ message: 'Invalid creator ID' });
        }
        console.log('Creator exists validation passed');
        
        console.log('Creating exam with data:', examData);
        
        const exam = await Exam.create(examData);
        console.log('Exam created:', exam);
        
        // Verify the status is set correctly
        console.log('Created exam status:', exam.status);
        
        // Populate the subject and creator details
        const populatedExam = await Exam.findById(exam._id)
          .populate('createdBy', 'firstName lastName facultyId')
          .populate('subject');
        console.log('Populated exam:', populatedExam);
        
        // Log the subject data specifically
        console.log('Exam subject data:', populatedExam.subject);
        console.log('Exam subject type:', typeof populatedExam.subject);
          
        res.status(201).json(populatedExam);
      } catch (error) {
        console.error('Error creating exam:', error);
        if (error.code === 11000) {
          res.status(400).json({ message: 'Exam title already exists' });
        } else if (error.name === 'ValidationError') {
          const messages = Object.values(error.errors).map(err => err.message);
          res.status(400).json({ message: 'Validation error', errors: messages });
        } else {
          res.status(500).json({ message: 'Error creating exam', error: error.message });
        }
      }
      break;
    case 'PUT':
      try {
        const { id, ...updateData } = req.body;
        
        // Process questions based on their type if provided
        if (updateData.questions) {
          updateData.questions = updateData.questions.map(question => {
            // For multiple-choice questions, ensure correctAnswer is a number
            if (question.type === 'multiple-choice' && typeof question.correctAnswer === 'string') {
              question.correctAnswer = parseInt(question.correctAnswer);
            }
            // For text-based and coding questions, correctAnswer can remain a string
            // Process attachments to ensure proper format
            if (question.attachments) {
              question.attachments = question.attachments.map(attachment => ({
                name: attachment.name || '',
                url: attachment.url || '',
                type: attachment.type || ''
              }));
            }
            return question;
          });
        }
        
        const exam = await Exam.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true
        }).populate('createdBy', 'firstName lastName facultyId')
          .populate('subject');
        
        if (!exam) {
          return res.status(404).json({ message: 'Exam not found' });
        }
        
        res.status(200).json(exam);
      } catch (error) {
        console.error('Error updating exam:', error);
        if (error.code === 11000) {
          return res.status(400).json({ message: 'Exam title already exists' });
        } else if (error.name === 'ValidationError') {
          const messages = Object.values(error.errors).map(err => err.message);
          res.status(400).json({ message: 'Validation error', errors: messages });
        } else {
          res.status(500).json({ message: 'Error updating exam', error: error.message });
        }
      }
      break;
    case 'DELETE':
      try {
        const examId = req.query.id || req.body.id;
        
        if (!examId) {
          return res.status(400).json({ message: 'Exam ID is required' });
        }
        
        const exam = await Exam.findByIdAndDelete(examId);
        
        if (!exam) {
          return res.status(404).json({ message: 'Exam not found' });
        }
        
        res.status(200).json({ message: 'Exam deleted successfully' });
      } catch (error) {
        console.error('Error deleting exam:', error);
        res.status(500).json({ message: 'Error deleting exam', error: error.message });
      }
      break;
    default:
      res.status(405).json({ message: 'Method not allowed' });
      break;
  }
}