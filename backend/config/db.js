import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.data');

// Embedded MongoDB for local development: no install needed, data persists in backend/.data
const startEmbedded = async () => {
  const { default: fs } = await import('fs');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  fs.mkdirSync(dataDir, { recursive: true });
  const server = await MongoMemoryServer.create({
    instance: { dbName: 'yakadabadu', dbPath: dataDir, storageEngine: 'wiredTiger' },
  });
  console.log('Using embedded MongoDB (data in backend/.data)');
  return server.getUri();
};

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    const embedded = !uri || uri === 'memory';
    if (embedded) uri = await startEmbedded();

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('MongoDB connected');

    if (embedded) {
      const { seedDemoData } = await import('./seed.js');
      await seedDemoData();
    }
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Set MONGODB_URI in backend/.env, or set it to "memory" for a local embedded database.');
    process.exit(1); // Exit the process if DB connection fails
  }
};

export default connectDB;
