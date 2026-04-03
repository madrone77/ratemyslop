export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Award } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard - RateMySlop",
  description: "Top AI-generated projects and contributors",
};

export default async function LeaderboardPage() {
  const supabase = await createClient();

  // Top projects
  const { data: topProjects } = await supabase
    .from("projects")
    .select("*, profiles(username, avatar_url)")
    .eq("status", "approved")
    .order("score", { ascending: false })
    .limit(25);

  // Top contributors
  const { data: topUsers } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_banned", false)
    .order("karma", { ascending: false })
    .limit(25);

  const rankIcon = (i: number) => {
    if (i === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (i === 1) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (i === 2) return <Trophy className="h-5 w-5 text-amber-700" />;
    return (
      <span className="w-5 text-center text-sm font-bold text-muted-foreground">
        {i + 1}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6 text-orange-500" />
          Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground">
          The best (and worst) of AI-generated projects
        </p>
      </div>

      <Tabs defaultValue="projects">
        <TabsList className="mb-4">
          <TabsTrigger value="projects">Top Projects</TabsTrigger>
          <TabsTrigger value="contributors">Top Contributors</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Highest Rated Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {topProjects?.map((project, i) => (
                <Link
                  key={project.id}
                  href={`/p/${project.slug}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-6 flex justify-center shrink-0">
                    {rankIcon(i)}
                  </div>

                  {project.thumbnail_url ? (
                    <img
                      src={project.thumbnail_url}
                      alt=""
                      className="h-10 w-10 rounded object-cover border shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {project.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {project.profiles?.username}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                    <span className="font-semibold text-sm">
                      {project.score}
                    </span>
                  </div>

                  <Badge variant="secondary" className="text-xs shrink-0">
                    {project.category}
                  </Badge>
                </Link>
              ))}

              {(!topProjects || topProjects.length === 0) && (
                <p className="text-center py-8 text-muted-foreground">
                  No projects yet. Be the first!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contributors">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Contributors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {topUsers?.map((user, i) => (
                <Link
                  key={user.id}
                  href={`/u/${user.username}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-6 flex justify-center shrink-0">
                    {rankIcon(i)}
                  </div>

                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{user.username}</p>
                    {user.display_name && (
                      <p className="text-xs text-muted-foreground">
                        {user.display_name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                    <span className="font-semibold text-sm">{user.karma}</span>
                    <span className="text-xs text-muted-foreground">karma</span>
                  </div>
                </Link>
              ))}

              {(!topUsers || topUsers.length === 0) && (
                <p className="text-center py-8 text-muted-foreground">
                  No contributors yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
