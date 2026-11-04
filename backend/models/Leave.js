import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  from: { type: Date, required: true },
  to: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  decisionNote: String,
  decidedBy: String,
}, { timestamps: true });

export default mongoose.model('Leave', leaveSchema);
