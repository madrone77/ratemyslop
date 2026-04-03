"use client";

import { useState, useTransition } from "react";
import { adminUpdateProject } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Check, X, Star, StarOff, Eye, Trash2, Search } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

interface AdminProjectsProps {
  projects: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    is_featured: boolean;
    score: number;
    category: string;
    created_at: string;
    profiles?: { username: string } | null;
  }>;
}

export function AdminProjects({ projects: initialProjects }: AdminProjectsProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.profiles?.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = (
    projectId: string,
    updates: Record<string, unknown>
  ) => {
    startTransition(async () => {
      const result = await adminUpdateProject(projectId, updates);
      if (!result.error) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, ...updates } : p))
        );
      }
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "removed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link
                      href={`/p/${project.slug}`}
                      className="font-medium hover:text-orange-500 max-w-[200px] truncate block"
                    >
                      {project.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {project.profiles?.username}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {project.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {project.score}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColor(project.status) as "default" | "secondary" | "destructive"} className="text-xs">
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {timeAgo(project.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      {project.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleAction(project.id, { status: "approved" })
                          }
                          disabled={isPending}
                          title="Approve"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleAction(project.id, {
                            is_featured: !project.is_featured,
                          })
                        }
                        disabled={isPending}
                        title={project.is_featured ? "Unfeature" : "Feature"}
                      >
                        {project.is_featured ? (
                          <StarOff className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </Button>
                      {project.status !== "removed" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleAction(project.id, { status: "removed" })
                          }
                          disabled={isPending}
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleAction(project.id, { status: "approved" })
                          }
                          disabled={isPending}
                          title="Restore"
                        >
                          <Eye className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No projects found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
