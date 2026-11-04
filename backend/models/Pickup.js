import mongoose from 'mongoose';

export const PICKUP_STATUSES = ['pending', 'assigned', 'on-the-way', 'completed', 'cancelled'];

const timelineSchema = new mongoose.Schema({
  status: String,
  at: { type: Date, default: Date.now },
  by: String, // display name of whoever made the change
  note: String,
}, { _id: false });

const pickupSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  address: { type: String, required: true },
  pickupType: { type: String, required: true }, // material key
  itemType: String,
  scale: String,
  scheduledTime: { type: Date, required: true },
  timeSlot: { type: String, enum: ['morning', 'afternoon', 'evening'], default: 'morning' },
  instructions: String,
  customerName: String,
  contactNumber: String,
  returnOption: String,
  status: { type: String, enum: PICKUP_STATUSES, default: 'pending' },
  timeline: [timelineSchema],
  estimatedWeight: Number,
  estimatedAmount: Number,
  weight: Number,
  amount: Number,
  completedAt: Date,
  cancelReason: String,
  cancelledBy: String,
  rating: {
    stars: { type: Number, min: 1, max: 5 },
    feedback: String,
    at: Date,
    flagged: { type: Boolean, default: false },
  },
}, { timestamps: true });

pickupSchema.index({ user: 1, scheduledTime: -1 });
pickupSchema.index({ driver: 1, status: 1 });

export default mongoose.model('Pickup', pickupSchema);
