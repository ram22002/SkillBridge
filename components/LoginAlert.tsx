"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

const LoginAlert = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full animate-fadeIn">
      <div className="card-border w-full max-w-md">
        <div className="card p-8 flex flex-col items-center gap-6 text-center">
          <div className="flex items-center justify-center blue-gradient rounded-full size-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8 text-dark-100"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-primary-100">Authentication Required</h3>
            <p className="text-light-100">
              Please log in to create and take interviews
            </p>
          </div>

          <Button asChild className="btn-primary w-full">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginAlert;
