"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");

  useEffect(() => {
    console.log("Agent component mounted");
    if (!vapi) {
        console.error("Vapi instance is null");
        return;
    }

    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      console.log("Call ended");
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: any) => {
      // Ignore "Meeting has ended" errors if we're already finished or it's just a disconnect
      if (error?.errorMsg === "Meeting has ended" || error?.error?.msg === "Meeting has ended") {
        console.log("Meeting ended gracefully (ignored error)");
        return;
      }

      console.error("Vapi Error:", error);
      if (error && typeof error === 'object') {
        console.error("Error details:", JSON.stringify(error, null, 2));
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback");

      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        console.log("Error saving feedback");
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        console.log("Interview generation call ended. Redirecting to dashboard...");
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    try {
      // Request microphone permission explicitly
      console.log("Requesting microphone permission...");
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert(
          "Microphone access blocked. Browsers only allow microphone access on localhost or HTTPS.\n\n" +
          "If you are on a phone/different device, please use Ngrok to get an HTTPS URL."
        );
        throw new Error("navigator.mediaDevices is undefined (Insecure Context)");
      }

      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone permission granted.");

      if (type === "generate") {
        console.log("Starting Vapi call (Generate) with Workflow ID:", process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID);
        vapi.stop(); 
        
        await vapi.start(
          {
            model: {
              provider: "vapi",
              model: "gpt-4",
              workflowId: process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!,
            },
          },
          {
            variableValues: {
              username: userName || "Guest",
              userid: userId || "anonymous",
              userId: userId || "anonymous",
            },
          }
        );
      } else {
        let formattedQuestions = "";
        if (questions) {
          formattedQuestions = questions
            .map((question) => `- ${question}`)
            .join("\n");
        }

        console.log("Starting Vapi call (Attributes) with Workflow ID:", process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID);
        
        // Inject the specific interview instructions
        const systemMessage = interviewer?.model?.messages?.[0]?.content || "You are an interviewer.";
        
        // Create a transient assistant config by merging the constant with the questions
        // This bypasses the remote Workflow entirely, ensuring we use our specific Prompt/Model.
        console.log("Creating Transient Assistant with Questions:", formattedQuestions);
        
        const interviewAssistant = {
           name: "Interviewer",
           firstMessage: "Hello! I'm ready to start your interview. I have your questions ready.",
           transcriber: {
             provider: "deepgram",
             model: "nova-2",
             language: "en",
           },
           voice: {
             provider: "11labs",
             voiceId: "sarah",
           },
           model: {
             provider: "openai" as const,
             model: "gpt-4",
             messages: [
               {
                 role: "system",
                 content: `You are a professional job interviewer. 
                 ASK THESE SPECIFIC QUESTIONS ONE BY ONE:
                 ${formattedQuestions}
                 
                 After each answer, ask a short follow-up or move to the next question.
                 Do not ask about the role or level again. just start with the first question.`,
               },
             ],
           },
        };

        console.log("Full Assistant Config being sent to Vapi:", JSON.stringify(interviewAssistant, null, 2));

        vapi.stop();
        // @ts-ignore - Explicitly casting this to any or ignoring because Vapi SDK types can be tricky with transient assistants
        await vapi.start(interviewAssistant);
        console.log("Vapi.start() called successfully with transient assistant.");
      }
    } catch (err: any) {
      console.error("Failed to start Vapi call:", err);
      console.error("Error message:", err.message);
      console.error("Error details:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        {/* Debug Info */}
        <div className="absolute top-4 left-4 text-xs text-gray-500 bg-gray-100 p-2 rounded opacity-50 hover:opacity-100 z-50">
           Mode: {type} <br/>
           Questions: {questions?.length || 0}
        </div>

        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center items-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}

        {/* Failsafe Redirect Button for Generation Mode */}
        {type === "generate" && (
           <button 
             className="btn-secondary ml-4" 
             onClick={() => router.push("/")}
           >
             Continue to Dashboard
           </button>
        )}
      </div>
    </>
  );
};

export default Agent;
