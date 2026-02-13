"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

import connectToDatabase from "@/lib/mongodb";
import Interview from "@/lib/models/interview.model";
import { getRandomInterviewCover } from "@/lib/utils";

// Define schema for structured output from Gemini
const interviewGenerationSchema = z.object({
  role: z
    .string()
    .describe(
      "The job role extracted from the conversation, e.g., 'Frontend Developer'"
    ),
  techStack: z
    .array(z.string())
    .describe(
      "The list of technologies mentioned or relevant to the role, e.g., ['React', 'Next.js']"
    ),
  level: z
    .string()
    .describe("The experience level, e.g., 'Junior', 'Mid-Level', 'Senior'"),
  type: z
    .enum(["Technical", "Behavioral", "Mixed"])
    .describe("The type of interview requested or implied"),
  questions: z
    .array(z.string())
    .min(5)
    .max(10)
    .describe(
      "A list of 5-10 interview questions based on the role and tech stack"
    ),
});

export async function generateInterviewFromTranscript(params: {
  userId: string;
  transcript: { role: string; content: string }[];
}) {
  const { userId, transcript } = params;

  try {
    await connectToDatabase();

    // Format transcript for the prompt
    const formattedTranscript = transcript
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const prompt = `
      Analyze the following conversation transcript between a user (candidate) and an AI interviewer.
      The user is setting up a mock interview by discussing their desired role, tech stack, and experience level.
      
      Extract the following details:
      1. Role (e.g., specific job title)
      2. Tech Stack (technologies mentioned)
      3. Experience Level
      4. Interview Type (Technical, Behavioral, or Mixed)
      
      Then, generate 5-10 challenging interview questions tailored to these details.
      
      Transcript:
      ${formattedTranscript}
      
      If any details are missing, infer reasonable defaults based on the context (e.g., "Full Stack Developer" -> "Technical").
    `;

    let extractionResult;

    try {
      const { object } = await generateObject({
        model: google("gemini-2.0-flash-001"),
        schema: interviewGenerationSchema,
        prompt: prompt,
      });
      extractionResult = object;
    } catch (aiError) {
      console.error("Gemini API Error (falling back to default):", aiError);
      // Fallback data if AI fails (e.g. quota exceeded)
      extractionResult = {
        role: "Software Engineer (Generated)",
        techStack: ["General", "Problem Solving"],
        level: "Mid-Level",
        type: "Mixed" as const,
        questions: [
          "Tell me about a challenging project you worked on.",
          "How do you handle tight deadlines?",
          "Explain a complex technical concept to a non-technical person.",
          "What are your strengths and weaknesses?",
          "Where do you see yourself in 5 years?",
        ],
      };
    }

    const interviewData = {
      role: extractionResult.role,
      techstack: extractionResult.techStack,
      level: extractionResult.level,
      type: extractionResult.type,
      questions: extractionResult.questions,
      userId: userId,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date(),
    };

    const interview = await Interview.create(interviewData);

    return { success: true, interviewId: interview._id.toString() };
  } catch (error) {
    console.error("Error generating interview from transcript:", error);
    return { success: false, error: "Failed to generate interview" };
  }
}
