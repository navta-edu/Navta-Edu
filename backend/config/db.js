const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('HINT: Check if your IP address (0.0.0.0/0 for Render) is whitelisted in MongoDB Atlas Network Access.');
    // Always crash if DB fails to connect so the frontend can fallback to Mock Mode
    process.exit(1);
  }
};

module.exports = connectDB;
