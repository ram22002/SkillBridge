
import mongoose from "mongoose";
import Interview from "../lib/models/interview.model";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable inside .env.local");
  process.exit(1);
}

async function checkDB() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log("Connected to MongoDB");

    const interviews = await Interview.find().sort({ createdAt: -1 }).limit(5);

    console.log(`Found ${interviews.length} recent interviews:`);
    interviews.forEach((interview) => {
      console.log(`- ID: ${interview._id}`);
      console.log(`  Role: ${interview.role}`);
      console.log(`  Questions: ${interview.questions.length} questions`);
      console.log(`  User: ${interview.userId}`);
      console.log(`  Created: ${interview.createdAt}`);
      console.log("---");
    });
    
    process.exit(0);
  } catch (error) {
    console.error("Error checking DB:", error);
    process.exit(1);
  }
}

checkDB();
