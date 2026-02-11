import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  interviewId: { type: String, required: true },
  userId: { type: String, required: true },
  totalScore: { type: Number, required: true },
  categoryScores: { type: Array, required: true },
  strengths: { type: [String], required: true },
  areasForImprovement: { type: [String], required: true },
  finalAssessment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Feedback =
  mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);

export default Feedback;
