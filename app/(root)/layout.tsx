import Link from "next/link";
import React from "react";
import Navbar from "@/components/Navbar";
import { ReactNode } from "react";

const Layout = async ({ children }: { children: ReactNode }) => {


  return (
    <div className="root-layout">
      <Navbar />

      <main className="flex min-h-screen flex-1 flex-col px-6 pb-6 pt-28 max-md:pb-14 sm:px-14">
        <div className="mx-auto w-full max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
