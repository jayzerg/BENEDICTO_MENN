import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  answers: { type: Map, of: String }, // questionId -> selectedOption
  score: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Result || mongoose.model('Result', resultSchema);