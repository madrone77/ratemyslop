import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ExternalLink } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { VoteButton } from "@/components/vote-button";
import type { Project } from "@/types/database";

interface ProjectCardProps {
  project: Project;
  rank?: number;
}

export function ProjectCard({ project, rank }: ProjectCardProps) {
  return (
    <article className="group flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border bg-card hover:border-orange-200 hover:shadow-sm transition-all">
      {rank && (
        <span className="text-xl font-bold text-muted-foreground/50 w-7 text-right shrink-0 mt-1 tabular-nums">
          {rank}
        </span>
      )}

      <VoteButton
        projectId={project.id}
        initialScore={project.score}
        initialVote={project.user_vote || 0}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <Link
            href={`/p/${project.slug}`}
            className="text-[16px] sm:text-[17px] font-semibold leading-snug hover:text-orange-500 transition-colors line-clamp-2"
          >
            {project.title}
          </Link>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground/60 hover:text-foreground shrink-0 mt-0.5"
            title="Visit project"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
          {project.description}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs font-normal">
            {project.category}
          </Badge>

          {project.ai_tools_used?.length > 0 && (
            <span className="hidden sm:inline text-muted-foreground/70">
              {project.ai_tools_used.slice(0, 2).join(", ")}
              {project.ai_tools_used.length > 2 &&
                ` +${project.ai_tools_used.length - 2}`}
            </span>
          )}

          <Link
            href={`/p/${project.slug}`}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {project.comment_count}
          </Link>

          <span className="hidden sm:inline">
            by{" "}
            <Link
              href={`/u/${project.profiles?.username}`}
              className="hover:text-foreground transition-colors"
            >
              {project.profiles?.username}
            </Link>
          </span>

          <span>{timeAgo(project.created_at)}</span>

          {project.is_featured && (
            <Badge className="bg-orange-50 text-orange-600 border-orange-200 font-normal">
              Featured
            </Badge>
          )}
        </div>
      </div>

      {project.thumbnail_url && (
        <Link href={`/p/${project.slug}`} className="shrink-0 hidden sm:block">
          <img
            src={project.thumbnail_url}
            alt={project.title}
            className="h-20 w-28 object-cover rounded-lg border"
          />
        </Link>
      )}
    </article>
  );
}
