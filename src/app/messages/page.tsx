import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Inbox from "@/components/Inbox";
export const dynamic = "force-dynamic";
export default async function MessagesPage() {
  if (!(await getCurrentUser(true))) redirect("/login?next=%2Fmessages");
  return <Inbox />;
}
