"use client";

import { useState, useTransition } from "react";
import { vote } from "@/lib/actions";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface VoteButtonProps {
  projectId: string;
  initialScore: number;
  initialVote?: number;
  layout?: "vertical" | "horizontal";
}

export function VoteButton({
  projectId,
  initialScore,
  initialVote = 0,
  layout = "vertical",
}: VoteButtonProps) {
  const [currentVote, setCurrentVote] = useState(initialVote);
  const [score, setScore] = useState(initialScore);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleVote = async (value: number) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const previousVote = currentVote;
    const previousScore = score;

    // Optimistic update
    if (currentVote === value) {
      setCurrentVote(0);
      setScore(score - value);
    } else {
      setCurrentVote(value);
      setScore(score - previousVote + value);
    }

    startTransition(async () => {
      const result = await vote(projectId, value);
      if (result.error) {
        setCurrentVote(previousVote);
        setScore(previousScore);
      }
    });
  };

  const isVertical = layout === "vertical";

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        isVertical ? "flex-col" : "flex-row"
      )}
    >
      <button
        onClick={() => handleVote(1)}
        disabled={isPending}
        className={cn(
          "p-1 rounded hover:bg-orange-50 transition-colors",
          currentVote === 1
            ? "text-orange-500"
            : "text-muted-foreground hover:text-orange-500"
        )}
        aria-label="Upvote"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums min-w-[2ch] text-center",
          currentVote === 1 && "text-orange-500",
          currentVote === -1 && "text-blue-500"
        )}
      >
        {formatNumber(score)}
      </span>
      <button
        onClick={() => handleVote(-1)}
        disabled={isPending}
        className={cn(
          "p-1 rounded hover:bg-blue-50 transition-colors",
          currentVote === -1
            ? "text-blue-500"
            : "text-muted-foreground hover:text-blue-500"
        )}
        aria-label="Downvote"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}
