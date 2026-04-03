import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t mt-auto py-6">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>
          rate<span className="text-orange-500">my</span>slop &copy;{" "}
          {new Date().getFullYear()}
        </p>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-foreground transition-colors">
            Feed
          </Link>
          <Link
            href="/leaderboard"
            className="hover:text-foreground transition-colors"
          >
            Leaderboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
