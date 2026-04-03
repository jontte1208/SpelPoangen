import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SectionIntro } from "@/components/dashboard/SectionIntro";
import ForumFeed from "@/components/forum/ForumFeed";

export const metadata = { title: "Forum" };

export default async function ForumPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  return (
    <main>
      <SectionIntro
        eyebrow="Forum"
        title="Hitta spelare att spela med"
        description="Lägg upp ett inlägg om du letar efter duos, ett team eller bara vill spela med nya folk."
      />
      <ForumFeed currentUserId={session.user.id} isAdmin={session.user.role === "ADMIN"} />
    </main>
  );
}
