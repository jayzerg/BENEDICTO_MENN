import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const studentSchema = new mongoose.Schema({
  studentId: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^2025-\d{6}$/.test(v);
      },
      message: props => `${props.value} is not a valid student ID format! Expected format: 2025-XXXXXX`
    }
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9._%+-]+@student\.edu$/.test(v);
      },
      message: props => `${props.value} is not a valid student email!`
    }
  },
  password: { type: String, required: true },
  enrolledSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  profilePicture: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

studentSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Create a virtual property for full name
studentSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
studentSchema.set('toJSON', {
  virtuals: true
});

export default mongoose.models.Student || mongoose.model('Student', studentSchema);