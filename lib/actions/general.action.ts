"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { feedbackSchema } from "@/constants";
import connectToDatabase from "@/lib/mongodb";
import Feedback from "@/lib/models/feedback.model";
import Interview from "@/lib/models/interview.model";

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    await connectToDatabase();

    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedbackData = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date(),
    };

    let feedback;

    if (feedbackId) {
       // Update existing feedback (upsert)
       feedback = await Feedback.findByIdAndUpdate(feedbackId, feedbackData, { new: true, upsert: true });
    } else {
       // Create new feedback
       feedback = await Feedback.create(feedbackData);
    }

    return { success: true, feedbackId: feedback._id.toString() };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  try {
    await connectToDatabase();
    const interview = await Interview.findById(id);
    if (!interview) return null;
    return { ...interview.toObject(), id: interview._id.toString() } as Interview;
  } catch (error) {
    console.error("Error getting interview:", error);
    return null;
  }
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  try {
    await connectToDatabase();
    const feedback = await Feedback.findOne({ interviewId, userId });
    
    if (!feedback) return null;

    return { ...feedback.toObject(), id: feedback._id.toString() } as Feedback;
  } catch (error) {
    console.error("Error getting feedback:", error);
    return null;
  }
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  try {
    await connectToDatabase();
    const interviews = await Interview.find({
      finalized: true,
      userId: { $ne: userId },
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return interviews.map((doc) => ({
      ...doc.toObject(),
      id: doc._id.toString(),
    })) as Interview[];
  } catch (error) {
    console.error("Error getting latest interviews:", error);
    return null;
  }
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  try {
    await connectToDatabase();
    const interviews = await Interview.find({ userId }).sort({ createdAt: -1 });

    return interviews.map((doc) => ({
      ...doc.toObject(),
      id: doc._id.toString(),
    })) as Interview[];
  } catch (error) {
    console.error("Error getting user interviews:", error);
    return null;
  }
}

