import { getCurrentUser } from "@/lib/auth";

/** Return the signed-in manager or null without leaking account details. */
export async function getAdminUser() {
  const user = await getCurrentUser(true);
  return user?.isAdmin ? user : null;
}

export function adminErrorResponse(message: string, status: 401 | 403 | 503) {
  return Response.json({ error: message }, { status });
}
