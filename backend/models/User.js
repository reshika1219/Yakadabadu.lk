import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  type: { type: String, enum: ['household', 'industrial'], default: 'household' },
  preferences: {
    materials: [String],
    timeSlot: { type: String, enum: ['morning', 'afternoon', 'evening', ''], default: '' },
    notifyEmail: { type: Boolean, default: true },
    notifySms: { type: Boolean, default: false },
  },
  suspended: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: { transform: (_doc, ret) => { delete ret.password; return ret; } },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);
