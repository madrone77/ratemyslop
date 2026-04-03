"use client";

import { useState, useTransition } from "react";
import { addComment, reportContent } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flag, MessageSquare, CornerDownRight } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";
import type { Comment } from "@/types/database";

interface CommentSectionProps {
  projectId: string;
  comments: Comment[];
  isLoggedIn: boolean;
}

export function CommentSection({
  projectId,
  comments,
  isLoggedIn,
}: CommentSectionProps) {
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Build threaded comments
  const rootComments = comments.filter((c) => !c.parent_id);
  const childMap = new Map<string, Comment[]>();
  comments.forEach((c) => {
    if (c.parent_id) {
      const children = childMap.get(c.parent_id) || [];
      children.push(c);
      childMap.set(c.parent_id, children);
    }
  });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        {comments.length} Comment{comments.length !== 1 ? "s" : ""}
      </h3>

      {/* Comment form */}
      {isLoggedIn ? (
        <CommentForm projectId={projectId} />
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/auth/login" className="text-orange-500 hover:underline">
            Log in
          </Link>{" "}
          to join the discussion
        </p>
      )}

      {/* Comments list */}
      <div className="space-y-3">
        {rootComments.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            childMap={childMap}
            projectId={projectId}
            isLoggedIn={isLoggedIn}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}

function CommentForm({
  projectId,
  parentId,
  onCancel,
  onSuccess,
}: {
  projectId: string;
  parentId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!body.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("body", body);
      formData.set("project_id", projectId);
      if (parentId) formData.set("parent_id", parentId);
      // Honeypot
      formData.set("phone", "");

      const result = await addComment(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setBody("");
        setError("");
        onSuccess?.();
        // Reload to show new comment
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Textarea
        placeholder={parentId ? "Write a reply..." : "Share your thoughts on this slop..."}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={parentId ? 2 : 3}
        className="resize-none"
      />
      <div className="flex items-center gap-2">
        <Button
          onClick={handleSubmit}
          disabled={isPending || !body.trim()}
          size="sm"
        >
          {isPending ? "Posting..." : parentId ? "Reply" : "Comment"}
        </Button>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

function CommentThread({
  comment,
  childMap,
  projectId,
  isLoggedIn,
  replyTo,
  setReplyTo,
  depth,
}: {
  comment: Comment;
  childMap: Map<string, Comment[]>;
  projectId: string;
  isLoggedIn: boolean;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  depth: number;
}) {
  const children = childMap.get(comment.id) || [];
  const [reportPending, startReportTransition] = useTransition();

  const handleReport = () => {
    startReportTransition(async () => {
      const formData = new FormData();
      formData.set("comment_id", comment.id);
      formData.set("reason", "spam");
      await reportContent(formData);
    });
  };

  return (
    <div className={depth > 0 ? "ml-6 border-l-2 pl-4" : ""}>
      <div className="flex items-start gap-3">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={comment.profiles?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {comment.profiles?.username?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href={`/u/${comment.profiles?.username}`}
              className="font-medium text-foreground hover:text-orange-500"
            >
              {comment.profiles?.username}
            </Link>
            <span>{timeAgo(comment.created_at)}</span>
          </div>

          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.body}</p>

          <div className="flex items-center gap-3 mt-1">
            {isLoggedIn && depth < 3 && (
              <button
                onClick={() =>
                  setReplyTo(replyTo === comment.id ? null : comment.id)
                }
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <CornerDownRight className="h-3 w-3" />
                Reply
              </button>
            )}
            <button
              onClick={handleReport}
              disabled={reportPending}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
            >
              <Flag className="h-3 w-3" />
              {reportPending ? "Reported" : "Report"}
            </button>
          </div>

          {replyTo === comment.id && (
            <div className="mt-2">
              <CommentForm
                projectId={projectId}
                parentId={comment.id}
                onCancel={() => setReplyTo(null)}
                onSuccess={() => setReplyTo(null)}
              />
            </div>
          )}
        </div>
      </div>

      {children.length > 0 && (
        <div className="mt-3 space-y-3">
          {children.map((child) => (
            <CommentThread
              key={child.id}
              comment={child}
              childMap={childMap}
              projectId={projectId}
              isLoggedIn={isLoggedIn}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
