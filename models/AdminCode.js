import mongoose from 'mongoose';

const adminCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.AdminCode || mongoose.model('AdminCode', adminCodeSchema);