import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['multiple-choice', 'text-based', 'coding'], 
    default: 'multiple-choice' 
  },
  options: [{ type: String }],
  correctAnswer: { type: mongoose.Schema.Types.Mixed }, // Can be number (MCQ) or string (text/coding)
  attachments: [{ 
    name: String,
    url: String,
    type: String // mime type
  }]
});

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  instructions: { type: String }, // Changed from description to instructions
  duration: { type: Number, required: true }, // in minutes
  surveillance: { type: Boolean, default: false }, // Changed from dueDate to surveillance
  questions: [questionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true }, // Added subject reference
  status: { 
    type: String, 
    enum: ['draft', 'published', 'closed'], 
    default: 'draft' 
  }, // Added status field
  isActive: { type: Boolean, default: true } // Kept for backward compatibility
}, { timestamps: true });

export default mongoose.models.Exam || mongoose.model('Exam', examSchema);