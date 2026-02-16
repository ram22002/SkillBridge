import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import connectToDatabase from "@/lib/mongodb";
import Interview from "@/lib/models/interview.model";

export async function POST(request: Request) {
  const body = await request.json();
  console.log("Received Vapi Webhook Request:", JSON.stringify(body, null, 2));
  
  // Extract fields from Vapi's tool call structure or direct body
  // Vapi sends tool calls in a specific format, sometimes nested in 'message' or 'toolCall'
  // But for a simple tool, it might be the body itself. 
  // Let's assume the body IS the arguments for now, but logging helps confirm.
  const { type, role, level, techstack, amount, userid } = body;

  try {
    await connectToDatabase();
    console.log("Connected to MongoDB");

    if (!role || !level || !techstack || !amount || !userid) {
       console.error("Missing required fields in request:", { role, level, techstack, amount, userid });
       return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }


    let questions;
    try {
      const result = await generateText({
        model: google("gemini-2.0-flash-001"),
        prompt: `Prepare questions for a job interview.
          The job role is ${role}.
          The job experience level is ${level}.
          The tech stack used in the job is: ${techstack}.
          The focus between behavioural and technical questions should lean towards: ${type}.
          The amount of questions required is: ${amount}.
          Please return only the questions, without any additional text.
          The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
          Return the questions formatted like this:
          ["Question 1", "Question 2", "Question 3"]
          
          Thank you! <3
      `,
      });
      questions = JSON.parse(result.text);
    } catch (aiError) {
      console.error("Error generating questions with AI, falling back to dummy questions:", aiError);
      questions = [
        `Could you tell me about your experience as a ${role}?`,
        `What is your proficiency with ${techstack.split(",")[0]}?`,
        `Describe a challenging project you worked on recently.`,
      ];
    }

    const interviewData = {
      role: role,
      type: type,
      level: level,
      techstack: techstack.split(","),
      questions: questions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date(),
    };

    const interview = await Interview.create(interviewData);
    console.log("Interview created successfully:", interview._id.toString());

    return Response.json({ success: true, id: interview._id.toString() }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}


export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
