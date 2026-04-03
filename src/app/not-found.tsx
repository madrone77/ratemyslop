export const dynamic = "force-dynamic";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-24 text-center">
      <p className="text-7xl font-bold text-muted-foreground/30">404</p>
      <h1 className="text-2xl font-bold mt-4">This slop doesn&apos;t exist</h1>
      <p className="text-muted-foreground mt-2">
        Maybe it was too sloppy even for us.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center mt-8 h-10 px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Back to the feed
      </Link>
    </div>
  );
}
