import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PlatformShell from "@/components/dashboard/PlatformShell";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { customImage: true },
  });

  const user = {
    ...session.user,
    image: dbUser?.customImage || session.user.image,
  };

  return <PlatformShell user={user}>{children}</PlatformShell>;
}