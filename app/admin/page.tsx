import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata = { title: "Admin Panel | Spelpoängen" };

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminDashboard />;
}
