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
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
      {rank && (
        <span className="text-lg font-bold text-muted-foreground w-6 text-right shrink-0 mt-1">
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
            className="font-medium hover:text-orange-500 transition-colors line-clamp-1"
          >
            {project.title}
          </Link>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
          {project.description}
        </p>

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {project.category}
          </Badge>

          {project.ai_tools_used?.length > 0 && (
            <span className="hidden sm:inline">
              Built with {project.ai_tools_used.slice(0, 2).join(", ")}
              {project.ai_tools_used.length > 2 &&
                ` +${project.ai_tools_used.length - 2}`}
            </span>
          )}

          <Link
            href={`/p/${project.slug}`}
            className="flex items-center gap-1 hover:text-foreground"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {project.comment_count}
          </Link>

          <span>
            by{" "}
            <Link
              href={`/u/${project.profiles?.username}`}
              className="hover:text-foreground"
            >
              {project.profiles?.username}
            </Link>
          </span>

          <span>{timeAgo(project.created_at)}</span>

          {project.is_featured && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
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
            className="h-16 w-24 object-cover rounded-md border"
          />
        </Link>
      )}
    </div>
  );
}
