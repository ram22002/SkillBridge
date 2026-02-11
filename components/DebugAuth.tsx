"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export const DebugAuth = () => {
  const { isLoaded, userId, sessionId, getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    console.log("DebugAuth: isLoaded", isLoaded);
    console.log("DebugAuth: userId", userId);
    console.log("DebugAuth: sessionId", sessionId);
    console.log("DebugAuth: user", user);
    
    const checkToken = async () => {
        try {
            const token = await getToken();
            console.log("DebugAuth: Token fetched", token ? "Yes" : "No");
        } catch (e) {
            console.error("DebugAuth: Token error", e);
        }
    };
    checkToken();
  }, [isLoaded, userId, sessionId, user, getToken]);

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50">
      <p>Auth Debug:</p>
      <p>Loaded: {isLoaded ? "Yes" : "No"}</p>
      <p>User ID: {userId || "None"}</p>
    </div>
  );
};
