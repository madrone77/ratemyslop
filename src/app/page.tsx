import { createClient } from "@/lib/supabase/server";
import { ProjectCard } from "@/components/project-card";
import { Badge } from "@/components/ui/badge";
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
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {settings?.announcement && (
        <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 text-sm text-orange-800">
          {settings.announcement}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">The Feed</h1>
          <p className="text-sm text-muted-foreground">
            AI-generated projects, rated by humans
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {(["hot", "new", "top"] as const).map((s) => (
            <Link
              key={s}
              href={`/?sort=${s}${category ? `&category=${category}` : ""}`}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize",
                sort === s
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <Link href={`/?sort=${sort}`}>
          <Badge
            variant={!category ? "default" : "secondary"}
            className="cursor-pointer whitespace-nowrap"
          >
            All
          </Badge>
        </Link>
        {categories?.map((cat) => (
          <Link key={cat.slug} href={`/?sort=${sort}&category=${cat.slug}`}>
            <Badge
              variant={category === cat.slug ? "default" : "secondary"}
              className="cursor-pointer whitespace-nowrap"
            >
              {cat.name}
            </Badge>
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {projectsWithVotes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No slop here yet</p>
            <p className="text-sm mt-1">
              Be the first to{" "}
              <Link href="/submit" className="text-orange-500 hover:underline">
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
