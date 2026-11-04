import mongoose from 'mongoose';

export const LISTING_CATEGORIES = ['furniture', 'electronics', 'appliances', 'metal-parts', 'building', 'tools', 'other'];
export const CONDITIONS = ['like-new', 'good', 'fair', 'for-parts'];

const offerSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName: String,
  amount: { type: Number, required: true, min: 1 },
  message: String,
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
}, { timestamps: true });

const listingSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerName: String,
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, enum: LISTING_CATEGORIES, default: 'other' },
  condition: { type: String, enum: CONDITIONS, default: 'good' },
  price: { type: Number, required: true, min: 1 },
  city: String,
  image: String, // optional data URL
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'sold', 'withdrawn'], default: 'pending' },
  adminNote: String,
  views: { type: Number, default: 0 },
  offers: [offerSchema],
  inspections: [{
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    buyerName: String,
    date: Date,
    note: String,
  }],
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  buyerName: String,
  soldPrice: Number,
  soldAt: Date,
}, { timestamps: true });

listingSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Listing', listingSchema);
