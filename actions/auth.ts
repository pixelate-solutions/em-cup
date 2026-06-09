"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { clearAdminSession, setAdminSession, verifyAdminPassword } from "@/lib/auth";

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type LoginState = {
  error?: string;
};

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password" };
  }

  if (!verifyAdminPassword(parsed.data.password)) {
    return { error: "Incorrect password" };
  }

  await setAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}
