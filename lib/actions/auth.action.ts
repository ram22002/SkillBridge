"use server";

import { currentUser } from "@clerk/nextjs/server";

export async function getCurrentUser() {
  const user = await currentUser();

  if (!user) return null;

  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.emailAddresses[0].emailAddress,
    imageUrl: user.imageUrl,
  };
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
