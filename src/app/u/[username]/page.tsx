export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { ProjectCard } from "@/components/project-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} - RateMySlop`,
    description: `Check out ${username}'s AI-generated projects on RateMySlop`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, profiles(username, avatar_url)")
    .eq("user_id", profile.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  let userVotes: Record<string, number> = {};
  if (user && projects?.length) {
    const { data: votes } = await supabase
      .from("votes")
      .select("project_id, value")
      .eq("user_id", user.id)
      .in(
        "project_id",
        projects.map((p) => p.id)
      );
    if (votes) {
      userVotes = Object.fromEntries(votes.map((v) => [v.project_id, v.value]));
    }
  }

  const projectsWithVotes = (projects || []).map((p) => ({
    ...p,
    user_vote: userVotes[p.id] || 0,
  }));

  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="flex items-start gap-5">
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="text-2xl">
            {profile.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold">{profile.username}</h1>
            {profile.role === "admin" && (
              <Badge className="bg-orange-50 text-orange-600 border-orange-200 font-normal">
                Admin
              </Badge>
            )}
            {profile.is_trusted && (
              <Badge variant="secondary" className="font-normal">
                Trusted
              </Badge>
            )}
          </div>

          {profile.display_name && (
            <p className="text-muted-foreground mt-0.5">{profile.display_name}</p>
          )}

          {profile.bio && (
            <p className="text-[15px] mt-3 leading-relaxed">{profile.bio}</p>
          )}

          <div className="flex flex-wrap items-center gap-5 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="font-semibold text-foreground">
                {profile.karma}
              </span>{" "}
              karma
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Joined {joinDate}
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      <h2 className="text-xl font-semibold mb-5">
        Submissions ({projectsWithVotes.length})
      </h2>

      <div className="space-y-3">
        {projectsWithVotes.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">
            No submissions yet
          </p>
        ) : (
          projectsWithVotes.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )}
      </div>
    </div>
  );
}
