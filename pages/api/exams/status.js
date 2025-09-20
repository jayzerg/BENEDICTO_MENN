import dbConnect from '../../../lib/dbConnect';
import Exam from '../../../models/Exam';

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'PUT':
      try {
        const { examId, status } = req.body;

        // Validate status
        if (!['draft', 'published', 'closed'].includes(status)) {
          return res.status(400).json({ message: 'Invalid status value' });
        }

        const exam = await Exam.findByIdAndUpdate(
          examId,
          { status },
          { new: true }
        );

        if (!exam) {
          return res.status(404).json({ message: 'Exam not found' });
        }

        res.status(200).json({ message: 'Exam status updated successfully', exam });
      } catch (error) {
        res.status(500).json({ message: 'Error updating exam status', error: error.message });
      }
      break;
    default:
      res.status(405).json({ message: 'Method not allowed' });
      break;
  }
}