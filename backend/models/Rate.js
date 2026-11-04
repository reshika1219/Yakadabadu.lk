import mongoose from 'mongoose';

const rateSchema = new mongoose.Schema({
  material: { type: String, required: true, unique: true },
  label: String,
  pricePerKg: { type: Number, required: true, min: 0 },
  history: [{ price: Number, at: { type: Date, default: Date.now }, _id: false }],
}, { timestamps: true });

export default mongoose.model('Rate', rateSchema);
