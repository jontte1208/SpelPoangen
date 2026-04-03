import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PostDetail from "@/components/forum/PostDetail";

export default async function ForumPostPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const post = await prisma.forumPost.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      content: true,
      game: true,
      pinned: true,
      commentsEnabled: true,
      createdAt: true,
      author: { select: { id: true, name: true, image: true, level: true, xp: true, role: true } },
    },
  });

  if (!post) notFound();

  const serialized = { ...post, createdAt: post.createdAt.toISOString(), author: { ...post.author, role: post.author.role as string } };

  return (
    <PostDetail
      post={serialized}
      currentUserId={session.user.id}
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
