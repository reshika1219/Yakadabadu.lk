import path from 'path';
import fs from 'fs';
import net from 'net';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.data');
const EMBEDDED_PORT = 27018;

const portInUse = (port) =>
  new Promise((resolve) => {
    const socket = net.connect(port, '127.0.0.1');
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
  });

// Embedded MongoDB for local development: no install needed, data persists in backend/.data.
// Uses a fixed port so a leftover instance from a crashed run is reused instead of locking the data folder.
const startEmbedded = async () => {
  const uri = `mongodb://127.0.0.1:${EMBEDDED_PORT}/yakadabadu`;
  if (await portInUse(EMBEDDED_PORT)) {
    console.log(`Reusing embedded MongoDB already running on port ${EMBEDDED_PORT}`);
    return uri;
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  fs.mkdirSync(dataDir, { recursive: true });
  const server = await MongoMemoryServer.create({
    instance: { dbName: 'yakadabadu', dbPath: dataDir, storageEngine: 'wiredTiger', port: EMBEDDED_PORT },
  });
  console.log('Using embedded MongoDB (data in backend/.data)');

  // nodemon restarts with SIGUSR2; stop mongod first so it never outlives the API
  let stopping = false;
  const shutdown = async (signal) => {
    if (stopping) return;
    stopping = true;
    await server.stop().catch(() => {});
    if (signal === 'SIGUSR2') process.kill(process.pid, 'SIGUSR2');
    else process.exit(0);
  };
  ['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach((sig) => process.once(sig, () => shutdown(sig)));
  return server.getUri('yakadabadu');
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
