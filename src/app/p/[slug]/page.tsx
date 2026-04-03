export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { reportContent } from "@/lib/actions";
import { VoteButton } from "@/components/vote-button";
import { CommentSection } from "@/components/comment-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ExternalLink,
  Flag,
  Calendar,
  Wrench,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("title, description")
    .eq("slug", slug)
    .single();

  if (!project) return { title: "Not Found" };

  return {
    title: `${project.title} - RateMySlop`,
    description: project.description.substring(0, 160),
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*, profiles(id, username, avatar_url, karma), project_images(*)")
    .eq("slug", slug)
    .single();

  if (!project || (project.status !== "approved" && project.status !== "pending")) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userVote = 0;
  if (user) {
    const { data: vote } = await supabase
      .from("votes")
      .select("value")
      .eq("user_id", user.id)
      .eq("project_id", project.id)
      .single();
    if (vote) userVote = vote.value;
  }

  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles(username, avatar_url)")
    .eq("project_id", project.id)
    .eq("is_removed", false)
    .order("created_at", { ascending: true });

  const images = project.project_images || [];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      {project.status === "pending" && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
          This submission is pending review and only visible to you.
        </div>
      )}

      {/* Title area */}
      <div className="flex items-start gap-4 sm:gap-5">
        <VoteButton
          projectId={project.id}
          initialScore={project.score}
          initialVote={userVote}
        />

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
            {project.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
            <Badge variant="secondary" className="font-normal">
              {project.category}
            </Badge>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {timeAgo(project.created_at)}
            </div>
            {project.is_featured && (
              <Badge className="bg-orange-50 text-orange-600 border-orange-200 font-normal">
                Featured
              </Badge>
            )}
          </div>

          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Visit Project
          </a>
        </div>
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 mt-8 p-4 rounded-xl bg-muted/50 border">
        <Avatar className="h-10 w-10">
          <AvatarImage src={project.profiles?.avatar_url || undefined} />
          <AvatarFallback className="text-sm">
            {project.profiles?.username?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <Link
            href={`/u/${project.profiles?.username}`}
            className="font-medium hover:text-orange-500 transition-colors"
          >
            {project.profiles?.username}
          </Link>
          <p className="text-xs text-muted-foreground">
            {project.profiles?.karma || 0} karma
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="mt-8">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
          {project.description}
        </p>
      </div>

      {/* AI Tools */}
      {project.ai_tools_used?.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Wrench className="h-4 w-4" />
            Built with
          </div>
          {project.ai_tools_used.map((tool: string) => (
            <Badge key={tool} variant="outline" className="font-normal">
              {tool}
            </Badge>
          ))}
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div className="mt-8 grid gap-4">
          {images
            .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
            .map((img: { id: string; url: string }) => (
              <img
                key={img.id}
                src={img.url}
                alt={project.title}
                className="rounded-xl border w-full"
              />
            ))}
        </div>
      )}

      {/* Report */}
      <div className="mt-6 flex justify-end">
        <form
          action={async () => {
            "use server";
            const formData = new FormData();
            formData.set("project_id", project.id);
            formData.set("reason", "spam");
            await reportContent(formData);
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="text-muted-foreground/60 gap-1.5 text-xs"
          >
            <Flag className="h-3.5 w-3.5" />
            Report
          </Button>
        </form>
      </div>

      <Separator className="my-8" />

      {/* Comments */}
      <CommentSection
        projectId={project.id}
        comments={comments || []}
        isLoggedIn={!!user}
      />
    </div>
  );
}
