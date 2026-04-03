"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus, LogOut, User, Shield, Trophy, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

export function Header() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
      setLoading(false);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold tracking-tight">
              rate<span className="text-orange-500">my</span>slop
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-[15px]">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Feed
            </Link>
            <Link
              href="/leaderboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Leaderboard
            </Link>
          </nav>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-24" />
          ) : user ? (
            <>
              <Link
                href="/submit"
                className={cn(
                  buttonVariants({ size: "default" }),
                  "gap-2 rounded-full px-4"
                )}
              >
                <Plus className="h-4 w-4" />
                Submit
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-9 w-9 rounded-full cursor-pointer ring-2 ring-transparent hover:ring-muted transition-all">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt={profile?.username}
                    />
                    <AvatarFallback className="text-sm">
                      {profile?.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-3 py-2">
                    <p className="font-medium">{profile?.username}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {profile?.karma || 0} karma
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer py-2"
                    onClick={() => router.push(`/u/${profile?.username}`)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer py-2"
                    onClick={() => router.push("/leaderboard")}
                  >
                    <Trophy className="h-4 w-4" />
                    Leaderboard
                  </DropdownMenuItem>
                  {profile?.role === "admin" && (
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer py-2"
                      onClick={() => router.push("/admin")}
                    >
                      <Shield className="h-4 w-4" />
                      Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="gap-2 cursor-pointer py-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "default" })
                )}
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className={cn(
                  buttonVariants({ size: "default" }),
                  "rounded-full px-5"
                )}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          {!loading && user && (
            <Link
              href="/submit"
              className={cn(
                buttonVariants({ size: "sm" }),
                "rounded-full px-3"
              )}
            >
              <Plus className="h-4 w-4" />
            </Link>
          )}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="p-2 -mr-2">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 pt-12">
              <nav className="flex flex-col gap-1">
                {user && profile && (
                  <div className="flex items-center gap-3 px-3 py-3 mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>
                        {profile.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{profile.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile.karma} karma
                      </p>
                    </div>
                  </div>
                )}

                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-[15px] hover:bg-muted transition-colors"
                >
                  Feed
                </Link>
                <Link
                  href="/leaderboard"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-[15px] hover:bg-muted transition-colors"
                >
                  Leaderboard
                </Link>

                {user ? (
                  <>
                    <Link
                      href="/submit"
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-2.5 rounded-lg text-[15px] hover:bg-muted transition-colors"
                    >
                      Submit Project
                    </Link>
                    <Link
                      href={`/u/${profile?.username}`}
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-2.5 rounded-lg text-[15px] hover:bg-muted transition-colors"
                    >
                      Profile
                    </Link>
                    {profile?.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="px-3 py-2.5 rounded-lg text-[15px] hover:bg-muted transition-colors"
                      >
                        Admin
                      </Link>
                    )}
                    <div className="border-t my-2" />
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileOpen(false);
                      }}
                      className="px-3 py-2.5 rounded-lg text-[15px] text-left text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="border-t my-2" />
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-2.5 rounded-lg text-[15px] hover:bg-muted transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        buttonVariants({ size: "default" }),
                        "rounded-full mx-3 mt-2"
                      )}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
