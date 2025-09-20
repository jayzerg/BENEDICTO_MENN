import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of default 30s
    }).then((mongoose) => {
      console.log('Connected to MongoDB successfully');
      return mongoose;
    }).catch((error) => {
      console.error('Error connecting to MongoDB:', error);
      throw new Error('Failed to connect to database');
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    console.error('Database connection failed:', error);
    cached.promise = null;
    throw error;
  }
  
  return cached.conn;
}

export default dbConnect;