import dbConnect from '../../../lib/dbConnect';
import Exam from '../../../models/Exam';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const exam = await Exam.findById(id)
          .populate('createdBy', 'firstName lastName facultyId')
          .populate('subject');
        if (!exam) {
          return res.status(404).json({ message: 'Exam not found' });
        }
        res.status(200).json(exam);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching exam', error: error.message });
      }
      break;
    case 'PUT':
      try {
        // Process questions based on their type if provided
        if (req.body.questions) {
          req.body.questions = req.body.questions.map(question => {
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
        
        const exam = await Exam.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true
        }).populate('createdBy', 'firstName lastName facultyId')
          .populate('subject');
        if (!exam) {
          return res.status(404).json({ message: 'Exam not found' });
        }
        res.status(200).json(exam);
      } catch (error) {
        if (error.code === 11000) {
          return res.status(400).json({ message: 'Exam title already exists' });
        }
        res.status(500).json({ message: 'Error updating exam', error: error.message });
      }
      break;
    case 'DELETE':
      try {
        const exam = await Exam.findByIdAndDelete(id);
        if (!exam) {
          return res.status(404).json({ message: 'Exam not found' });
        }
        res.status(200).json({ message: 'Exam deleted successfully' });
      } catch (error) {
        res.status(500).json({ message: 'Error deleting exam', error: error.message });
      }
      break;
    default:
      res.status(405).json({ message: 'Method not allowed' });
      break;
  }
}