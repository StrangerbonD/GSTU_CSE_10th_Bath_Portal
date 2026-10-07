import { cookies } from "next/headers";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard - GSTU CSE 10th Batch Portal",
  description: "User dashboard and community feed",
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("auth_user_min")?.value;
  let initialUser = null;
  if (userCookie) {
    try {
      initialUser = JSON.parse(decodeURIComponent(userCookie));
    } catch {}
  }

  const thoughtCookie = cookieStore.get("auth_user_thought")?.value;
  let initialThought = null;
  if (thoughtCookie) {
    try {
      initialThought = JSON.parse(decodeURIComponent(thoughtCookie));
    } catch {}
  }

  return <DashboardClient initialUser={initialUser} initialThought={initialThought} />;
}
