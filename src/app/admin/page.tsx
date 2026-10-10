import SellerPanel from "@/components/SellerPanel";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await getCurrentUser(true);
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/");
  return <SellerPanel />;
}
