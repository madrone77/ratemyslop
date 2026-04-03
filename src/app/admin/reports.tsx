"use client";

import { useState, useTransition } from "react";
import {
  adminResolveReport,
  adminUpdateProject,
  adminUpdateComment,
  adminUpdateUser,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Trash2, Ban } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

interface Report {
  id: string;
  reason: string;
  details: string | null;
  created_at: string;
  project_id: string | null;
  comment_id: string | null;
  profiles?: { username: string } | null;
  projects?: { title: string; slug: string } | null;
  comments?: { body: string } | null;
}

export function AdminReports({ reports: initialReports }: { reports: Report[] }) {
  const [reports, setReports] = useState(initialReports);
  const [isPending, startTransition] = useTransition();

  const handleResolve = (reportId: string) => {
    startTransition(async () => {
      const result = await adminResolveReport(reportId);
      if (!result.error) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    });
  };

  const handleRemoveContent = (report: Report) => {
    startTransition(async () => {
      if (report.project_id) {
        await adminUpdateProject(report.project_id, { status: "removed" });
      }
      if (report.comment_id) {
        await adminUpdateComment(report.comment_id, { is_removed: true });
      }
      await adminResolveReport(report.id);
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    });
  };

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No pending reports. The slop is clean (for now).
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {report.reason}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Reported by {report.profiles?.username} &middot;{" "}
                    {timeAgo(report.created_at)}
                  </span>
                </div>

                {report.projects && (
                  <p className="text-sm">
                    Project:{" "}
                    <Link
                      href={`/p/${report.projects.slug}`}
                      className="font-medium text-orange-500 hover:underline"
                    >
                      {report.projects.title}
                    </Link>
                  </p>
                )}

                {report.comments && (
                  <p className="text-sm mt-1 p-2 rounded bg-muted">
                    &ldquo;{report.comments.body.substring(0, 200)}
                    {report.comments.body.length > 200 ? "..." : ""}&rdquo;
                  </p>
                )}

                {report.details && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {report.details}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResolve(report.id)}
                  disabled={isPending}
                  title="Dismiss"
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveContent(report)}
                  disabled={isPending}
                  title="Remove content"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
