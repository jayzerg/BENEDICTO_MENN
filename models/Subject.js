import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  subjectName: { type: String, required: true },
  subjectCode: { type: String, required: true, unique: true },
  courseLevel: { 
    type: String, 
    required: true,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year']
  },
  prerequisite: { type: String },
  assignedFaculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Reference to both User and Student collections
}, { timestamps: true });

export default mongoose.models.Subject || mongoose.model('Subject', subjectSchema);