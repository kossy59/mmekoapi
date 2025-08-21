const mongoose = require('mongoose');
require('dotenv').config();

const connectDb = async () => {
  try {
    const uri = process.env.DB;
    if (!uri) {
      throw new Error('Missing DB connection string in env (process.env.DB)');
    }
    // Optional explicit database name via DB_NAME if your URI does not include one
    const dbName = process.env.DB_NAME && process.env.DB_NAME.trim() !== '' ? process.env.DB_NAME.trim() : undefined;

    // Lightly log the host for debugging without exposing credentials
    const masked = uri.replace(/:\\S+@/, ':***@');
    console.log(`[DEBUG] Connecting to MongoDB -> ${masked}${dbName ? ` (dbName=${dbName})` : ''}`);

    await mongoose.connect(uri, {
      autoIndex: true,
      // If DB name is not in the URI, specify it here via DB_NAME
      dbName,
      serverSelectionTimeoutMS: 15000,
    });
  } catch (err) {
    console.error('[MongoDB] Connection error:', err?.message || err);
    throw err;
  }
};

module.exports = connectDb;