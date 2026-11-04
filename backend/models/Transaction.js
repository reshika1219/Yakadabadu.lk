import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  ref: String,
  type: { type: String, enum: ['pickup-payout', 'resale'], required: true },
  amount: { type: Number, required: true },
  commission: { type: Number, default: 0 },
  recyclerValue: { type: Number, default: 0 }, // estimated value of scrap sold on to recyclers
  from: { id: mongoose.Schema.Types.ObjectId, name: String },
  to: { id: mongoose.Schema.Types.ObjectId, name: String },
  pickup: { type: mongoose.Schema.Types.ObjectId, ref: 'Pickup' },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  material: String,
  note: String,
  date: { type: Date, default: Date.now },
}, { timestamps: true });

transactionSchema.index({ date: -1 });

export default mongoose.model('Transaction', transactionSchema);
