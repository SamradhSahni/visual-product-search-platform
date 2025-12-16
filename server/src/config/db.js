// server/src/config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // options can be added here if needed
      
    });
    console.log("📛 DB NAME:", mongoose.connection.name);
    console.log("📛 DB HOST:", mongoose.connection.host);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
