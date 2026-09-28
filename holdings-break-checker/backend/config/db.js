const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the connection string in MONGO_URI.
 * The process exits if the connection cannot be established, since
 * nothing in this app is usable without the database.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('MONGO_URI is not set. Copy .env.example to .env and set it.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
