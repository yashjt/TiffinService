const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Make sure to use the same MongoDB URI that your Next.js app is using
    // This URI should be set in your environment variables
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB is connected - Now sharing database with Next.js app");

    // Check available collections to verify connection to the right database
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "Available collections:",
      collections.map((c) => c.name).join(", ")
    );
  } catch (error) {
    console.log("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
