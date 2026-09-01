import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/bazaar";
    await mongoose.connect(mongoUri);
    console.log("Successfully connected to MongoDB.");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    console.warn("Server will continue running, but database features will be unavailable.");
  }
};

export default connectDB;
