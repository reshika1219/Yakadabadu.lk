import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  type: { type: String, default: 'info' }, // pickup | market | leave | info
  title: { type: String, required: true },
  body: String,
  link: String,
  read: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
