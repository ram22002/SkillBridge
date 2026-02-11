import Vapi from "@vapi-ai/web";

// Safe initialization
const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
if (!token) {
  console.error("Vapi Web Token is missing!");
}

export const vapi = new Vapi(token || "dummy-token"); // Prevent crash, but it won't work

