import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, required: true, match: /^\S+@\S+\.\S+$/ },
  password: { type: String, required: true },
  phone: String,
  role: { type: String, enum: ['driver', 'admin'], default: 'driver' },
  birthday: Date,
  nationality: { type: String, default: 'Sri Lankan' },
  employeeId: { type: String, unique: true },
  employeeType: { type: String, enum: ['Permanent', 'Contract', 'Trainee'], default: 'Permanent' },
  nic: { type: String, unique: true, sparse: true },
  employeeStatus: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
  joinedDate: { type: Date, default: Date.now },
  vehicleCategory: String,
  vehicleNumber: String,
  status: { type: String, enum: ['available', 'on-route', 'unavailable'], default: 'available' },
  currentLocation: { lat: Number, lng: Number },
  profilePicture: String,
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => { delete ret.password; delete ret.id; return ret; },
  },
});

driverSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Auto-generate an employee id when staff are added without one
driverSchema.pre('validate', async function (next) {
  if (!this.employeeId) {
    const count = await mongoose.model('Driver').countDocuments();
    this.employeeId = `EMP-${String(count + 1).padStart(3, '0')}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  }
  next();
});

export default mongoose.model('Driver', driverSchema);
