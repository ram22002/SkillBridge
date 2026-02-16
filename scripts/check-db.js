
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable inside .env.local");
  process.exit(1);
}

// Simple Schema for Interview to avoid importing the TS model
const interviewSchema = new mongoose.Schema({
  role: String,
  type: String,
  level: String,
  questions: [String],
  techstack: [String],
  userId: String,
  finalized: Boolean,
  createdAt: Date,
});

const Interview = mongoose.models.Interview || mongoose.model("Interview", interviewSchema);

async function checkDB() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    const interviews = await Interview.find().sort({ createdAt: -1 }).limit(5);

    console.log(`\nFound ${interviews.length} recent interviews:`);
    interviews.forEach((interview) => {
      console.log(`- ID: ${interview._id}`);
      console.log(`  Role: ${interview.role}`);
      console.log(`  Questions (${interview.questions.length}):`);
      // Print first 2 questions to verify content
      interview.questions.slice(0, 2).forEach(q => console.log(`    * ${q}`));
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
