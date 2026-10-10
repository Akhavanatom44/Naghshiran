import AdminDashboard from "@/components/AdminDashboard";
import AdminLogin from "@/components/AdminLogin";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // The login form can still initialize the D1 schema and bootstrap the
    // manager account when the first request has no session yet.
  }

  if (!user?.isAdmin) return <AdminLogin />;
  return <AdminDashboard />;
}
