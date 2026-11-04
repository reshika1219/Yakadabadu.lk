import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  checkIn: Date,
  checkOut: Date,
}, { timestamps: true });

attendanceSchema.index({ driver: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
