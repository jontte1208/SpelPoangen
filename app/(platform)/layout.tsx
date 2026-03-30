import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PlatformShell from "@/components/dashboard/PlatformShell";
import { authOptions } from "@/lib/auth";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return <PlatformShell user={session.user}>{children}</PlatformShell>;
}