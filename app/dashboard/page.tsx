import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PlatformShell from "@/components/dashboard/PlatformShell";
import { authOptions } from "@/lib/auth";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const { user } = session;

  return (
    <PlatformShell user={user}>
      <DashboardShell user={user} />
    </PlatformShell>
  );
}