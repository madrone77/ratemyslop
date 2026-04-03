export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { ProjectCard } from "@/components/project-card";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ sort?: string; category?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { sort = "hot", category } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .single();

  let query = supabase
    .from("projects")
    .select("*, profiles(username, avatar_url)")
    .eq("status", "approved");

  if (category) {
    query = query.eq("category", category);
  }

  switch (sort) {
    case "new":
      query = query.order("created_at", { ascending: false });
      break;
    case "top":
      query = query.order("score", { ascending: false });
      break;
    case "hot":
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("score", { ascending: false })
        .order("created_at", { ascending: false });
      break;
  }

  query = query.limit(50);

  const { data: projects } = await query;

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

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      {settings?.announcement && (
        <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-200 text-sm text-orange-800">
          {settings.announcement}
        </div>
      )}

      {/* Hero area */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          The Feed
        </h1>
        <p className="text-base text-muted-foreground mt-1">
          AI-generated projects, rated by humans.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Sort tabs */}
        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
          {(["hot", "new", "top"] as const).map((s) => (
            <Link
              key={s}
              href={`/?sort=${s}${category ? `&category=${category}` : ""}`}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full transition-all capitalize",
                sort === s
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </Link>
          ))}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 w-full sm:w-auto">
          <Link
            href={`/?sort=${sort}`}
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap border",
              !category
                ? "bg-foreground text-background border-foreground"
                : "text-muted-foreground border-border hover:border-foreground/30"
            )}
          >
            All
          </Link>
          {categories?.map((cat) => (
            <Link
              key={cat.slug}
              href={`/?sort=${sort}&category=${cat.slug}`}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap border",
                category === cat.slug
                  ? "bg-foreground text-background border-foreground"
                  : "text-muted-foreground border-border hover:border-foreground/30"
              )}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Project list */}
      <div className="space-y-3">
        {projectsWithVotes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">-_-</p>
            <p className="text-lg font-medium text-muted-foreground">
              No slop here yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to{" "}
              <Link
                href="/submit"
                className="text-orange-500 hover:underline font-medium"
              >
                submit a project
              </Link>
            </p>
          </div>
        ) : (
          projectsWithVotes.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              rank={sort === "top" ? i + 1 : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
