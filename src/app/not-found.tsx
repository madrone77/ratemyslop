export const dynamic = "force-dynamic";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-xl mt-4">This slop doesn&apos;t exist</p>
      <p className="text-muted-foreground mt-2">
        Maybe it was too sloppy even for us.
      </p>
      <Link
        href="/"
        className={cn(buttonVariants({ size: "lg" }), "mt-6")}
      >
        Back to the feed
      </Link>
    </div>
  );
}
