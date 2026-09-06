import { cookies } from "next/headers";
import { DEMO_VIEWER_ID } from "./demo";
import { getStore } from "./store";

const AUTH_COOKIE = "needreel_user";

export async function getCurrentUserId(): Promise<string> {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE)?.value || DEMO_VIEWER_ID;
}

export async function getCurrentUser() {
  const [userId, store] = await Promise.all([getCurrentUserId(), getStore()]);
  return store.users.find((user) => user.id === userId) ?? store.users[0];
}

export { AUTH_COOKIE };
